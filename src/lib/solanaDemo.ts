/**
 * Solana Demo Anchoring System
 * 
 * Simulated blockchain anchoring for hackathon demos.
 * No real blockchain dependencies, just clean proof-of-concept.
 */

export interface SimulatedAnchorResult {
  did: string
  hash: string
  txHash: string
  network: string
  timestamp: number
  status: 'confirmed'
}

/**
 * Generate a realistic fake transaction hash
 * 
 * Base58-like characters (excludes 0, O, I, l to avoid confusion).
 * Length between 64-88 characters to match real Solana tx hashes.
 */
function generateFakeTxHash(): string {
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const length = 64 + Math.floor(Math.random() * 24) // 64-88 chars
  
  let hash = ''
  for (let i = 0; i < length; i++) {
    hash += base58Chars[Math.floor(Math.random() * base58Chars.length)]
  }
  
  return hash
}

/**
 * Generate SHA-256 hash of DID
 * 
 * Uses native Web Crypto API (no external dependencies).
 */
async function generateDIDHash(did: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(did)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Simulate anchoring a DID to Solana devnet
 * 
 * Perfect for hackathon demos — no real blockchain needed.
 * Generates realistic-looking transaction hash and proof.
 * 
 * @param did The DID to anchor
 * @returns Simulated anchor result with tx hash, proof hash, timestamp
 */
export async function anchorDIDSimulated(did: string): Promise<SimulatedAnchorResult> {
  try {
    console.log('[Demo Anchor] Anchoring DID:', did)

    // Generate DID hash using SHA-256
    console.log('[Demo Anchor] Computing DID hash...')
    const hash = await generateDIDHash(did)
    console.log('[Demo Anchor] Generated hash:', hash.slice(0, 16) + '...')

    // Simulate network delay (1-2 seconds)
    console.log('[Demo Anchor] Sending transaction...')
    await new Promise(resolve => setTimeout(resolve, 1200))

    // Generate fake but realistic-looking tx hash
    const txHash = generateFakeTxHash()
    const timestamp = Date.now()

    console.log('[Demo Anchor] ✅ Transaction confirmed:', txHash)
    console.log('[Demo Anchor] Timestamp:', new Date(timestamp).toISOString())

    return {
      did,
      hash,
      txHash,
      network: 'Solana Devnet (Simulated)',
      timestamp,
      status: 'confirmed',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Demo Anchor] ❌ Failed to anchor:', message)
    throw new Error(`Demo anchoring failed: ${message}`)
  }
}

/**
 * Generate Solscan link for demo
 * 
 * While the tx hash is simulated, the link format is valid.
 */
export function getSolscanLink(txHash: string): string {
  return `https://solscan.io/tx/${txHash}?cluster=devnet`
}
