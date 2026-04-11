/**
 * ED25519 Cryptography Module
 * 
 * Handles all cryptographic operations:
 * - Key generation (ED25519)
 * - Digital signatures
 * - Key storage & retrieval
 */

import nacl from 'tweetnacl';
import { encode as encodeBase64, decode as decodeBase64 } from 'js-base64';
import storage from './storage';

export interface KeyPair {
  publicKey: string; // Base64 encoded
  secretKey: string; // Base64 encoded (NEVER transmitted)
  did: string;
}

/**
 * Generate a new ED25519 keypair
 */
export function generateKeyPair(): KeyPair {
  const keys = nacl.sign.keyPair();

  // Convert Uint8Array to base64 string directly (binary safe)
  const pubKeyBase64 = encodeBase64(
    String.fromCharCode.apply(null, Array.from(keys.publicKey))
  );
  const secretKeyBase64 = encodeBase64(
    String.fromCharCode.apply(null, Array.from(keys.secretKey))
  );
  
  const did = `did:ion:${pubKeyBase64.slice(0, 20).replace(/\//g, '_').replace(/\+/g, '-')}`;

  return {
    publicKey: pubKeyBase64,
    secretKey: secretKeyBase64,
    did
  };
}

/**
 * Sign a message with a secret key
 */
export function signMessage(message: string, secretKeyBase64: string): string {
  const secretKeyStr = decodeBase64(secretKeyBase64);
  const secretKey = new Uint8Array(
    secretKeyStr.split('').map(c => c.charCodeAt(0))
  );
  const messageBytes = new TextEncoder().encode(message);

  const sig = nacl.sign(messageBytes, secretKey);
  const sigStr = String.fromCharCode.apply(null, Array.from(sig));
  return encodeBase64(sigStr);
}

/**
 * Verify a signature with a public key
 */
export function verifySignature(
  message: string,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  try {
    const signatureStr = decodeBase64(signatureBase64);
    const publicKeyStr = decodeBase64(publicKeyBase64);

    const sig = new Uint8Array(signatureStr.split('').map(c => c.charCodeAt(0)));
    const pk = new Uint8Array(publicKeyStr.split('').map(c => c.charCodeAt(0)));
    
    const opened = nacl.sign.open(sig, pk);
    return opened !== null && new TextDecoder().decode(opened) === message;
  } catch (error) {
    console.error('[Crypto] Signature verification error:', error);
    return false;
  }
}

/**
 * Store keypair in encrypted storage
 */
export async function storeKeyPair(keyPair: KeyPair, userId: string): Promise<void> {
  await storage.setState(`keypair-${userId}`, {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
    did: keyPair.did,
    createdAt: new Date().toISOString()
  });
  console.log(`[Crypto] Keypair stored for user ${userId}: ${keyPair.did}`);
}

/**
 * Retrieve keypair from encrypted storage
 */
export async function retrieveKeyPair(userId: string): Promise<KeyPair | null> {
  const stored = await storage.getState(`keypair-${userId}`);
  if (!stored) return null;

  return {
    publicKey: stored.publicKey as string,
    secretKey: stored.secretKey as string,
    did: stored.did as string
  };
}

/**
 * Check if user has stored keypair
 */
export async function hasKeyPair(userId: string): Promise<boolean> {
  const keyPair = await retrieveKeyPair(userId);
  return keyPair !== null;
}
