/**
 * Encrypted IndexedDB storage wrapper with AES-GCM encryption.
 * 
 * SECURITY CRITICAL:
 * - All data persisted to IndexedDB is encrypted with application-level AES-GCM
 * - Encryption key is derived from device key using HKDF
 * - No raw PII is stored — only hashes, commitments, and public data
 * - Private keys are NEVER persisted to disk; they live only in memory with extractable: false
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SovereignIDSchema extends DBSchema {
  credentials: {
    key: string;
    value: {
      id: string;
      data: string; // Base64 encoded encrypted data (was ArrayBuffer)
      iv: string; // Base64 encoded IV
      timestamp: number;
    };
  };
  operations: {
    key: string;
    value: {
      id: string;
      type: 'enrollment' | 'verification' | 'credentialIssue' | 'presentation';
      data: string; // Base64 encoded encrypted data
      iv: string;
      timestamp: number;
      pending: boolean;
    };
  };
  state: {
    key: string;
    value: {
      id: string;
      data: string; // Base64 encoded encrypted data
      iv: string;
      timestamp: number;
    };
  };
}

/**
 * Derive an encryption key from the device's cryptographic material.
 * In production, this uses Web Crypto API with HKDF-SHA256.
 * The device key is stored in secure enclosure (Android Keystore / Secure Enclave).
 * 
 * TODO: Integrate with actual device key provisioning at first app launch.
 */
async function deriveEncryptionKey(deviceKeyMaterial: ArrayBuffer): Promise<CryptoKey> {
  const importedKey = await crypto.subtle.importKey(
    'raw',
    deviceKeyMaterial,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(),
      info: new TextEncoder().encode('sovereignid-app-encryption-v1')
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false, // extractable: false — key cannot leave the browser
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-GCM.
 */
async function encryptData(
  plaintext: ArrayBuffer,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Convert ArrayBuffer to base64 for safe storage in IndexedDB
  const ciphertextArray = new Uint8Array(ciphertext);
  const ciphertextBase64 = btoa(String.fromCharCode.apply(null, Array.from(ciphertextArray)));

  return {
    ciphertext: ciphertextBase64,
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

/**
 * Decrypt ciphertext using AES-GCM.
 */
async function decryptData(
  ciphertextBase64: string,
  iv: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  // Convert base64 back to ArrayBuffer
  const binaryString = atob(ciphertextBase64);
  const ciphertext = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    ciphertext[i] = binaryString.charCodeAt(i);
  }

  const ivBuffer = new Uint8Array(
    iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    ciphertext
  );
}

export class EncryptedStorage {
  private db: IDBPDatabase<SovereignIDSchema> | null = null;
  private encryptionKey: CryptoKey | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the encrypted storage layer.
   * @param deviceKeyMaterial - Cryptographic material from device secure storage (32+ bytes)
   */
  async init(deviceKeyMaterial: ArrayBuffer): Promise<void> {
    if (this.db && this.encryptionKey) {
      return;
    }

    this.db = await openDB<SovereignIDSchema>('sovereignid-store', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('credentials')) {
          db.createObjectStore('credentials', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'id' });
        }
      }
    });

    this.encryptionKey = await deriveEncryptionKey(deviceKeyMaterial);
    console.log('[Storage] Encrypted storage initialized');
  }

  /**
   * Lazily open IndexedDB and derive a session key if init() was skipped or failed during app bootstrap.
   */
  async ensureInitialized(): Promise<void> {
    if (this.db && this.encryptionKey) return;
    if (!this.initPromise) {
      const key = crypto.getRandomValues(new Uint8Array(32));
      this.initPromise = this.init(key.buffer).finally(() => {
        this.initPromise = null;
      });
    }
    await this.initPromise;
  }

  private async requireReady(): Promise<[IDBPDatabase<SovereignIDSchema>, CryptoKey]> {
    await this.ensureInitialized();
    const db = this.db;
    const key = this.encryptionKey;
    if (!db || !key) {
      throw new Error('Storage not initialized');
    }
    return [db, key];
  }

  /**
   * Store an encrypted credential.
   * Hard rule: No raw biometric data. Only hashes and commitments stored.
   */
  async setCredential(id: string, data: Record<string, unknown>): Promise<void> {
    const [db, key] = await this.requireReady();

    try {
      const plaintext = new TextEncoder().encode(JSON.stringify(data)).buffer;
      const { ciphertext, iv } = await encryptData(plaintext, key);

      await db.put('credentials', {
        id,
        data: ciphertext,
        iv,
        timestamp: Date.now()
      });

      console.log(`[Storage] Credential ${id} encrypted and stored`);
    } catch (error) {
      console.error(`[Storage] Failed to store credential ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt a credential.
   */
  async getCredential(id: string): Promise<Record<string, unknown> | null> {
    const [db, key] = await this.requireReady();

    try {
      const record = await db.get('credentials', id);
      if (!record) return null;

      const plaintext = await decryptData(record.data as string, record.iv, key);
      return JSON.parse(new TextDecoder().decode(plaintext));
    } catch (error) {
      console.error(`[Storage] Failed to retrieve credential ${id}:`, error);
      return null;
    }
  }

  /**
   * Store a pending offline operation (enrollment, verification, etc.).
   * Used by the operation queue for retry on reconnect.
   */
  async setOperation(
    id: string,
    type: 'enrollment' | 'verification' | 'credentialIssue' | 'presentation',
    data: Record<string, unknown>
  ): Promise<void> {
    const [db, key] = await this.requireReady();

    try {
      const plaintext = new TextEncoder().encode(JSON.stringify(data)).buffer;
      const { ciphertext, iv } = await encryptData(plaintext, key);

      await db.put('operations', {
        id,
        type,
        data: ciphertext,
        iv,
        timestamp: Date.now(),
        pending: true
      });

      console.log(`[Storage] Operation ${id} queued (type: ${type})`);
    } catch (error) {
      console.error(`[Storage] Failed to queue operation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark an operation as completed.
   */
  async completeOperation(id: string): Promise<void> {
    const [db] = await this.requireReady();

    const record = await db.get('operations', id);
    if (record) {
      await db.put('operations', {
        ...record,
        pending: false
      });
      console.log(`[Storage] Operation ${id} marked complete`);
    }
  }

  /**
   * Get all pending operations (for offline queue retry).
   */
  async getPendingOperations(): Promise<Array<{
    id: string;
    type: 'enrollment' | 'verification' | 'credentialIssue' | 'presentation';
    data: Record<string, unknown>;
  }>> {
    const [db, key] = await this.requireReady();

    try {
      const records = await db.getAll('operations');
      const pending = records.filter(r => r.pending);

      const decrypted = await Promise.all(
        pending.map(async (record) => {
          const plaintext = await decryptData(record.data as string, record.iv, key);
          return {
            id: record.id,
            type: record.type,
            data: JSON.parse(new TextDecoder().decode(plaintext))
          };
        })
      );

      return decrypted;
    } catch (error) {
      console.error('[Storage] Failed to get pending operations:', error);
      return [];
    }
  }

  /**
   * Store application state (app-wide settings, recovery key hashes, biometric binding, etc.).
   */
  async setState(id: string, state: Record<string, unknown>): Promise<void> {
    const [db, key] = await this.requireReady();

    try {
      const plaintext = new TextEncoder().encode(JSON.stringify(state)).buffer;
      const { ciphertext, iv } = await encryptData(plaintext, key);

      await db.put('state', {
        id,
        data: ciphertext,
        iv,
        timestamp: Date.now()
      });

      console.log(`[Storage] State ${id} encrypted and stored`);
    } catch (error) {
      console.error(`[Storage] Failed to store state ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve application state.
   */
  async getState(id: string): Promise<Record<string, unknown> | null> {
    const [db, key] = await this.requireReady();

    try {
      const record = await db.get('state', id);
      if (!record) return null;

      const plaintext = await decryptData(record.data as string, record.iv, key);
      return JSON.parse(new TextDecoder().decode(plaintext));
    } catch (error) {
      console.error(`[Storage] Failed to retrieve state ${id}:`, error);
      return null;
    }
  }

  /**
   * Clear all encrypted storage (e.g., on deactivation or factory reset).
   * Hard rule: Voluntary identity deactivation flow on resettlement.
   * TODO: Voluntary identity deactivation flow on resettlement
   */
  async nuke(): Promise<void> {
    const [db] = await this.requireReady();

    await db.clear('credentials');
    await db.clear('operations');
    await db.clear('state');
    console.log('[Storage] All encrypted data nuked');
  }
}

// Global singleton
const storage = new EncryptedStorage();
export default storage;
