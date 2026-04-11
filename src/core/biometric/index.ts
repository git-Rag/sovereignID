/**
 * Biometric Binding (face-api.js)
 * 
 * TODO: face-api.js for in-browser face embedding
 * - Capture face from camera
 * - Generate TFLite face embedding
 * - Hash embedding with SHA-256
 * - Hard rule: No raw biometric data stored — only hash
 * - Bind hash to DID document as biometric commitment
 */

export async function captureFaceEmbedding(): Promise<ArrayBuffer> {
  // TODO: face-api.js integration with camera
  throw new Error('Not yet implemented');
}

export async function hashFaceEmbedding(_embedding: ArrayBuffer): Promise<string> {
  // TODO: SHA-256 hash of embedding
  // Hard rule: Only hash stored, never the embedding itself
  throw new Error('Not yet implemented');
}

export async function verifyBiometricBinding(
  _embedding: ArrayBuffer,
  _commitment: string
): Promise<boolean> {
  // TODO: Verify embedding against stored commitment hash
  throw new Error('Not yet implemented');
}

export async function bindBiometricToDID(
  _did: string,
  _embeddingHash: string
): Promise<void> {
  // TODO: Store biometric commitment in DID document
  throw new Error('Not yet implemented');
}
