/// <reference types="vite/client" />

/**
 * Environment Configuration for SovereignID v2 (Solana + Arweave)
 * 
 * Loads and validates environment variables at startup
 * All crypto operations use these configs
 */

// Declare Vite environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_SOLANA_NETWORK?: 'devnet' | 'testnet' | 'mainnet'
    readonly VITE_SOLANA_RPC?: string
    readonly VITE_SOLANA_KEYPAIR?: string
    readonly VITE_ARWEAVE_HOST?: string
    readonly VITE_ARWEAVE_ENV?: 'testnet' | 'mainnet'
    readonly VITE_USDC_MINT?: string
    readonly VITE_ENV?: 'development' | 'staging' | 'production'
    readonly VITE_DEBUG?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

/**
 * Solana Configuration
 */
export const SOLANA_CONFIG = {
  network: (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com',
  feePayerSecret: import.meta.env.VITE_SOLANA_KEYPAIR || undefined,
} as const

/**
 * Arweave Configuration
 */
export const ARWEAVE_CONFIG = {
  host: import.meta.env.VITE_ARWEAVE_HOST || 'arweave.net',
  protocol: 'https' as const,
  port: 443,
  timeout: 60000, // 60 second timeout for uploads
  // Use testnet for hackathon (free), mainnet for production
  env: (import.meta.env.VITE_ARWEAVE_ENV || 'testnet') as 'testnet' | 'mainnet',
} as const

/**
 * USDC Token Configuration (SPL Token on Solana)
 */
export const USDC_CONFIG = {
  // Devnet USDC mint
  mintDevnet: import.meta.env.VITE_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  decimals: 6, // USDC has 6 decimal places
} as const

/**
 * Application Environment
 */
export const APP_ENV = (import.meta.env.VITE_ENV || 'development') as 'development' | 'staging' | 'production'

/**
 * Debug Mode
 */
export const DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true'

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const errors: string[] = []

  if (!SOLANA_CONFIG.rpcUrl) {
    errors.push('VITE_SOLANA_RPC is required')
  }

  if (!import.meta.env.VITE_ARWEAVE_HOST) {
    errors.push('VITE_ARWEAVE_HOST is required')
  }

  if (!import.meta.env.VITE_USDC_MINT) {
    errors.push('VITE_USDC_MINT is required')
  }

  if (errors.length > 0) {
    console.error('[Env] Missing required environment variables:', errors)
    if (APP_ENV === 'production') {
      throw new Error(`Missing environment variables: ${errors.join(', ')}`)
    }
  }

  if (DEBUG_MODE) {
    console.log('[Env] Configuration loaded:', {
      solana: SOLANA_CONFIG,
      arweave: ARWEAVE_CONFIG,
      usdc: USDC_CONFIG,
      environment: APP_ENV,
    })
  }
}

/**
 * Get Arweave API host URL
 */
export function getArweaveHost(): string {
  return `${ARWEAVE_CONFIG.protocol}://${ARWEAVE_CONFIG.host}`
}

/**
 * Get Solana transaction explorer URL
 */
export function getSolanaExplorerUrl(signature: string): string {
  const cluster = SOLANA_CONFIG.network === 'devnet' ? 'devnet' : SOLANA_CONFIG.network
  return `https://solscan.io/tx/${signature}?cluster=${cluster}`
}

/**
 * Get Arweave transaction explorer URL
 */
export function getArweaveExplorerUrl(txId: string): string {
  return `https://arweave.net/${txId}`
}
