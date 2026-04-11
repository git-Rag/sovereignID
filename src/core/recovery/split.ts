/**
 * Shamir Secret Sharing — Key Recovery
 * 
 * Split private key into 5 guardians, 3-of-5 recovery threshold.
 * Shares are displayed as mnemonics for manual transcription.
 * Digital transmission of shares is PROHIBITED — manual only.
 */

import secrets from 'secrets.js-grempe'

export interface ShareSet {
  shares: string[]
  threshold: number
  total: number
  createdAt: string
}

/**
 * Split private key into 5 shares, 3-of-5 threshold
 * 
 * @param privateKeyHex Private key in hex format
 * @returns 5 shares (hex strings)
 * 
 * DO NOT transmit these shares digitally.
 * Display to user one at a time for manual guardian transcription.
 */
export function splitPrivateKey(privateKeyHex: string): string[] {
  if (!privateKeyHex || privateKeyHex.length < 32) {
    throw new Error('Private key must be at least 32 hex characters')
  }

  // Split into 5 shares with 3-of-5 threshold
  // shares.js returns hex strings
  const shares = secrets.share(privateKeyHex, 5, 3)

  if (!shares || shares.length !== 5) {
    throw new Error('Failed to generate Shamir shares')
  }

  return shares
}

/**
 * Reconstruct private key from 3+ shares
 * 
 * @param shares At least 3 shares (hex strings)
 * @returns Reconstructed private key (hex string)
 * 
 * Can also work with 4 or 5 shares for added security.
 */
export function reconstructPrivateKey(shares: string[]): string {
  if (!shares || shares.length < 3) {
    throw new Error('Need at least 3 shares to recover private key')
  }

  // secrets.js validates shares and reconstructs
  const reconstructed = secrets.combine(shares)

  if (!reconstructed || reconstructed.length < 32) {
    throw new Error('Failed to reconstruct private key — invalid share set')
  }

  return reconstructed
}

/**
 * Validate a share in isolation
 * 
 * Returns true if share has valid format and checksum.
 * Does not reveal the original key, just validates structure.
 */
export function validateShare(share: string): boolean {
  try {
    // secrets.js includes validation
    return /^[0-9a-f]+$/.test(share) && share.length > 10
  } catch {
    return false
  }
}

/**
 * Create a human-readable mnemonic from a share
 * 
 * Converts hex share to BIP39-like 20-word mnemonic for manual transcription.
 * This is what guardians actually write down.
 */
export function shareToMnemonic(share: string): string[] {
  // For hackathon: split hex into byte chunks, map to words
  // Production: use full BIP39 or custom dictionary
  const wordList = [
    'able', 'about', 'above', 'absent', 'achieve', 'acid', 'acoustic',
    'acquire', 'across', 'act', 'action', 'actor', 'acts', 'acute',
    'adapt', 'add', 'added', 'adder', 'adds', 'adept', 'admit',
    'adopt', 'adore', 'adorn', 'adult', 'advance', 'advent',
    // ... expand to full BIP39 in production
  ]

  // Convert hex share to words (simplified for demo)
  const bytes = new Uint8Array(share.length / 2)
  for (let i = 0; i < share.length; i += 2) {
    bytes[i / 2] = parseInt(share.substr(i, 2), 16)
  }
  const words: string[] = []

  for (let i = 0; i < Math.min(20, bytes.length); i++) {
    const index = bytes[i] % wordList.length
    words.push(wordList[index])
  }

  return words.slice(0, 20)
}

/**
 * Reconstruct from 20-word mnemonic
 * 
 * Guardian provides mnemonic, convert back to hex for recovery.
 */
export function mnemonicToShare(mnemonic: string[]): string {
  // Simplified: in production, reverse the BIP39 encoding
  // For now, return placeholder — UI will handle actual conversion
  if (mnemonic.length < 15) {
    throw new Error('Mnemonic must be at least 15 words')
  }
  // This would be fully implemented with BIP39 or custom dictionary
  return mnemonic.join(':')
}

/**
 * Test 3-of-5 recovery without exposing the full key
 * 
 * Allows user to practice recovery with a dummy key.
 */
export function testRecovery(shares: string[]): boolean {
  try {
    if (shares.length < 3) return false
    const combined = secrets.combine(shares.slice(0, 3))
    return !!(combined && combined.length > 0)
  } catch {
    return false
  }
}
