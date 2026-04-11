/**
 * Solana Utility — Production-ready for devnet
 * 
 * Loads funded keypair from environment and provides connection.
 */

import { Connection, Keypair } from '@solana/web3.js'
import { SOLANA_CONFIG } from './env'

/**
 * Get Solana connection
 */
export function getConnection(): Connection {
  return new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed')
}

/**
 * Load keypair from environment (VITE_PRIVATE_KEY)
 * 
 * Must be a valid base58-encoded secret key or JSON array of bytes.
 * Exported from Phantom/Solflare or generated via solana-keygen.
 */
export function getKeypair(): Keypair {
  const privateKeyStr = import.meta.env.VITE_PRIVATE_KEY
  
  if (!privateKeyStr) {
    throw new Error(
      '[Solana] VITE_PRIVATE_KEY not found in .env.local. ' +
      'Add your funded keypair: VITE_PRIVATE_KEY=[byte1,byte2,...]'
    )
  }

  try {
    // Parse as JSON array: [1, 2, 3, ..., 64 bytes]
    const secretBytes = JSON.parse(privateKeyStr)
    
    if (!Array.isArray(secretBytes) || secretBytes.length !== 64) {
      throw new Error('Invalid keypair length')
    }

    const secretKey = new Uint8Array(secretBytes)
    return Keypair.fromSecretKey(secretKey)
  } catch (error) {
    throw new Error(
      `[Solana] Failed to parse VITE_PRIVATE_KEY. Make sure it's a JSON array of 64 bytes: ${error}`
    )
  }
}

/**
 * Check wallet balance
 * 
 * @returns Balance in lamports
 */
export async function getBalance(publicKey: string): Promise<number> {
  const connection = getConnection()
  const { PublicKey } = await import('@solana/web3.js')
  const pubkey = new PublicKey(publicKey)
  return await connection.getBalance(pubkey)
}

/**
 * Get keypair's public key as string
 */
export function getPublicKey(): string {
  const keypair = getKeypair()
  return keypair.publicKey.toString()
}
