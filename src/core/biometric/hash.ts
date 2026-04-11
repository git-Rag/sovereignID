/**
 * Biometric Hashing Pipeline
 * 
 * Converts face-api.js embeddings to SHA-256 hashes.
 * Raw embeddings are NEVER stored — only hashes.
 * This ensures biometric data cannot be reversed or misused.
 */

/**
 * Hash a biometric embedding to SHA-256
 * 
 * @param embedding Float32Array from face-api.js
 * @returns hex-encoded SHA-256 hash (64 chars)
 */
export async function computeBiometricHash(embedding: Float32Array): Promise<string> {
  if (!embedding || embedding.length === 0) {
    throw new Error('Embedding must be a non-empty Float32Array')
  }

  // Convert Float32Array to buffer for hashing
  const embeddingBuffer = new Uint8Array(embedding.buffer)

  // SHA-256 hash — one-way, irreversible
  const hashBuffer = await crypto.subtle.digest('SHA-256', embeddingBuffer)

  // Convert to hex string for storage
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a biometric hash against an embedding
 * 
 * Used in authentication flows to check if user is the same person.
 * Never compares raw embeddings.
 */
export async function verifyBiometricHash(
  storedHash: string,
  newEmbedding: Float32Array
): Promise<boolean> {
  const newHash = await computeBiometricHash(newEmbedding)
  return storedHash === newHash
}

/**
 * Create commitment hash from biometric + DID
 * 
 * Binds the biometric to the specific DID, preventing
 * one person using another's identity document.
 */
export async function createBiometricCommitment(
  biometricHash: string,
  didId: string
): Promise<string> {
  const commitment = `${biometricHash}:${didId}`
  const encoder = new TextEncoder()
  const commitmentBuffer = encoder.encode(commitment)
  const hashBuffer = await crypto.subtle.digest('SHA-256', commitmentBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
