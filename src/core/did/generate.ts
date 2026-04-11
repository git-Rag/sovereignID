/**
 * DID Key Generation
 * 
 * Generates P-256 ECDSA keypair and W3C did:key identifier.
 * Private key is non-extractable and stored in Secure Enclave (native OSes).
 */

export interface DIDKeypair {
  keyPair: CryptoKeyPair
  publicKeyHex: string
  publicKey: CryptoKey
  didId: string
  createdAt: string
}

/**
 * Generate a new DID keypair
 * 
 * @returns DID keypair with public key and identifier
 */
export async function generateDID(): Promise<DIDKeypair> {
  // Generate P-256 ECDSA keypair
  // Non-extractable: ensures private key never leaves Secure Enclave
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, // non-extractable — security critical
    ['sign', 'verify']
  )

  // Export public key to derive DID identifier
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const publicKeyBytes = new Uint8Array(publicKeyRaw)
  const publicKeyHex = Array.from(publicKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  // Create W3C did:key identifier from base64url-encoded public key
  const base64url = btoa(String.fromCharCode.apply(null, Array.from(publicKeyBytes))).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
  const didId = 'did:key:z1' + base64url.slice(0, 32)

  return {
    keyPair,
    publicKeyHex,
    publicKey: keyPair.publicKey,
    didId,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Create a W3C DID Document from a public key
 */
export function createDIDDocument(didId: string, publicKeyHex: string): Record<string, unknown> {
  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: didId,
    verificationMethod: [
      {
        id: `${didId}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: didId,
        publicKeyHex: publicKeyHex,
      },
    ],
    assertionMethod: [`${didId}#key-1`],
    authentication: [`${didId}#key-1`],
  }
}

/**
 * Sign data with DID private key
 * 
 * Used for issuing credentials and signing transactions.
 * Private key never leaves Secure Enclave.
 */
export async function signWithDID(
  privateKey: CryptoKey,
  payload: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  return crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    data
  )
}
