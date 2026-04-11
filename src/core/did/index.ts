/**
 * DID Generation and Management
 * 
 * Generates W3C-compliant DIDs anchored conceptually on Bitcoin (via ION protocol pattern)
 * - Generate EC P-256 public/private keypair (using ED25519)
 * - Construct DID document with public key + biometric hash commitment
 * - Upload DID document to IPFS via Pinata API (TODO)
 * - Cache locally in IndexedDB
 * - Resolve DIDs from Bitcoin anchors or cache
 */

import { generateKeyPair, storeKeyPair, signMessage } from '../../lib/crypto';
import storage from '../../lib/storage';
import { getUserId } from '../../lib/config';

export interface DIDDocument {
  '@context': string[];
  id: string;
  publicKeys: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyBase64: string;
  }>;
  biometricCommitment?: string; // SHA-256 hash, never raw data
  serviceEndpoints?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
  proof?: {
    type: string;
    created: string;
    signatureValue: string;
  };
}

/**
 * Generate a new DID for the user
 * Stores keypair and returns DID document
 */
export async function generateDID(biometricHash?: string): Promise<DIDDocument> {
  try {
    const userId = await getUserId();
    console.log('[DID] Generating keypair for user:', userId);
    
    const keyPair = generateKeyPair();
    console.log('[DID] Keypair generated:', {
      did: keyPair.did,
      publicKeyLength: keyPair.publicKey.length,
      secretKeyLength: keyPair.secretKey.length
    });

    // Store keypair in encrypted storage
    await storeKeyPair(keyPair, userId);
    console.log(`[DID] Generated keypair with DID: ${keyPair.did}`);

    // Create DID document (W3C compliant)
    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: keyPair.did,
      publicKeys: [
        {
          id: `${keyPair.did}#keys-1`,
          type: 'Ed25519VerificationKey2020',
          controller: keyPair.did,
          publicKeyBase64: keyPair.publicKey
        }
      ]
    };

    // Add biometric commitment if provided (hard rule: only hash, never raw data)
    if (biometricHash) {
      didDocument.biometricCommitment = biometricHash;
      console.log('[DID] Biometric hash commitment added (no PII)');
    }

    // Add service endpoints for future credential issuance/verification
    didDocument.serviceEndpoints = [
      {
        id: `${keyPair.did}#service-1`,
        type: 'VerifiableCredentialService',
        serviceEndpoint: 'did:web:example.com/credentials'
      }
    ];

    // Sign the DID document
    console.log('[DID] Signing DID document...');
    const payload = JSON.stringify({
      id: didDocument.id,
      publicKeys: didDocument.publicKeys,
      biometricCommitment: didDocument.biometricCommitment || null,
      created: new Date().toISOString()
    });

    const signature = signMessage(payload, keyPair.secretKey);
    console.log('[DID] Document signed successfully');
    
    didDocument.proof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      signatureValue: signature
    };

    // Store DID document in encrypted storage
    await storage.setCredential(`did-${userId}`, didDocument as unknown as Record<string, unknown>);
    console.log(`[DID] DID document stored locally: ${keyPair.did}`);

    return didDocument;
  } catch (error) {
    console.error('[DID] Generation failed:', error);
    throw error;
  }
}

/**
 * Retrieve stored DID document
 */
export async function retrieveDID(): Promise<DIDDocument | null> {
  const userId = await getUserId();
  const doc = await storage.getCredential(`did-${userId}`);
  return doc as DIDDocument | null;
}

/**
 * Create DID document (factory)
 */
export async function createDIDDocument(
  _publicKeyJwk: Record<string, unknown>,
  _biometricCommitment: string
): Promise<DIDDocument> {
  // Now implemented in generateDID
  return generateDID(_biometricCommitment);
}

/**
 * TODO: Anchor DID on Bitcoin
 * In production, this would:
 * 1. Use ion-tools to create ION operations
 * 2. Include the DID document hash in the operation
 * 3. Post to Bitcoin testnet/mainnet
 * 4. Wait for confirmation
 */
export async function anchoDIDOnBitcoin(_didDocument: DIDDocument): Promise<string> {
  // Placeholder: In real implementation, use ion-tools
  console.warn('[DID] TODO: Anchor on Bitcoin via ION protocol');
  return _didDocument.id; // Would return Bitcoin transaction ID
}

/**
 * TODO: Resolve DID from Bitcoin
 * In production, this would:
 * 1. Query Bitcoin for the DID anchor operation
 * 2. Verify the proof chain
 * 3. Return the resolved DID document
 */
export async function resolveDID(_did: string): Promise<DIDDocument | null> {
  // Placeholder: First check local cache
  const cached = await retrieveDID();
  if (cached && cached.id === _did) {
    console.log(`[DID] Resolved locally: ${_did}`);
    return cached;
  }

  // TODO: Query Bitcoin for resolution
  console.warn('[DID] TODO: Resolve from Bitcoin via ION');
  return null;
}

/**
 * Re-export new Solana + Arweave v2 functions for direct access
 * These provide the new tech stack without breaking existing code
 */
export { 
  generateDID as generateDIDKeypair,
  createDIDDocument as createDIDDocumentFromPublicKey,
  signWithDID 
} from './generate'

export { 
  anchorDIDToSolana,
  verifyAnchorOnChain 
} from './anchor'


