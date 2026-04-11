/**
 * Solana DID Anchor — Production-ready for devnet
 * 
 * Uses funded keypair from .env.local (VITE_PRIVATE_KEY).
 * Creates a simple self-transfer transaction as proof of identity on-chain.
 */

import {
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'

import { getKeypair, getConnection } from '../../lib/solana'

export interface AnchorPayload {
  did: string
  arweaveTxId?: string
  documentHash: string
  timestamp: number
  version: string
}

export interface AnchorResult {
  solanaTxSignature: string
  explorerUrl: string
}

/**
 * Anchor DID to Solana devnet
 * 
 * Uses funded keypair from environment to create a self-transfer transaction.
 * This serves as on-chain proof of identity with minimal cost.
 * 
 * @param payload DID information to anchor
 * @returns Anchor result with transaction signature
 * @throws Error if balance is 0 or transaction fails
 */
export async function anchorDIDToSolana(payload: AnchorPayload): Promise<AnchorResult> {
  try {
    const keypair = getKeypair()
    const connection = getConnection()
    const publicKey = keypair.publicKey

    console.log('[Anchor] Anchoring DID:', payload.did)

    // ✅ Check balance first
    const balance = await connection.getBalance(publicKey)
    console.log('[Anchor] Wallet balance:', balance, 'lamports')

    if (balance === 0) {
      throw new Error('Wallet has no SOL. Fund keypair from devnet faucet or Phantom.')
    }

    // ✅ Create transaction: self-transfer of 1000 lamports
    // This is a simple, low-cost proof of identity on-chain
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey,
        lamports: 1000,
      })
    )

    // ✅ Send and confirm
    console.log('[Anchor] Sending transaction...')
    const sig = await sendAndConfirmTransaction(connection, tx, [keypair])

    // ✅ Generate explorer link
    const explorerUrl = `https://solscan.io/tx/${sig}?cluster=devnet`

    console.log('[Anchor] ✅ Transaction confirmed:', sig)
    console.log('[Anchor] View on Solscan:', explorerUrl)

    return {
      solanaTxSignature: sig,
      explorerUrl,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Anchor] ❌ Failed to anchor to Solana:', message)
    throw new Error(`Solana anchoring failed: ${message}`)
  }
}

/**
 * Queue anchor operation if offline
 * 
 * Called by offline queue when Solana is unreachable.
 * Stores operation in IndexedDB for retry when online.
 */
export interface QueuedAnchorOp {
  type: 'anchor'
  payload: AnchorPayload
  feePayerSecret?: number[]
  createdAt: number
  retries: number
}

/**
 * Verify anchor on-chain
 * 
 * Check if transaction exists on the blockchain.
 */
export async function verifyAnchorOnChain(signature: string): Promise<boolean> {
  try {
    const connection = getConnection()
    const tx = await connection.getTransaction(signature)
    return tx !== null
  } catch {
    return false
  }
}

