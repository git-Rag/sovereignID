/**
 * useWallet Hook
 *
 * Manages wallet state including USDC balance, airdrop status, and M-Pesa conversion.
 * Integrates with Solana SPL token queries and mock withdrawal flows.
 */

import { useState, useEffect, useCallback } from 'react'
import { MOCK_USDC_BALANCE, mockMPesaWithdrawal } from '../lib/mock'

export interface WalletState {
  usdc_balance: number
  loading: boolean
  error: string
  hasReceivedAirdrop: boolean
  withdrawalPending: boolean
  withdrawalResult: {
    success: boolean
    reference: string
    message: string
  } | null
}

interface WalletActions {
  refreshBalance: () => Promise<void>
  requestAirdrop: () => Promise<void>
  withdrawToMPesa: (amount: number, phoneNumber: string) => Promise<void>
  clearError: () => void
  resetWithdrawal: () => void
}

const initialState: WalletState = {
  usdc_balance: 0,
  loading: true,
  error: '',
  hasReceivedAirdrop: false,
  withdrawalPending: false,
  withdrawalResult: null,
}

/**
 * Hook to manage wallet operations
 *
 * For hackathon:
 * - USDC balance is mocked at 50.00 (simulating aid airdrop)
 * - M-Pesa withdrawal is simulated 3-second processing
 *
 * Production version will:
 * - Query real SPL token balance from Solana devnet
 * - Call real M-Pesa API via backend relayer
 */
export function useWallet(): [WalletState, WalletActions] {
  const [state, setState] = useState<WalletState>(initialState)

  // Initialize balance on mount
  useEffect(() => {
    refreshBalance()
  }, [])

  const refreshBalance = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))

      // TODO: Replace with real SPL token query on production
      // import { getUSDCBalance } from '../wallet/solana/usdc'
      // const balance = await getUSDCBalance(walletPublicKey)

      // For hackathon demo: return mock balance
      const balance = MOCK_USDC_BALANCE

      // Check if balance was updated (simulating airdrop)
      setState(prev => ({
        ...prev,
        usdc_balance: balance,
        hasReceivedAirdrop: balance > 0,
        loading: false,
      }))

      // Store to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('wallet-balance', JSON.stringify(balance))
      }

      console.log('[Wallet] Balance refreshed:', balance)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch balance'
      setState(prev => ({ ...prev, error: message, loading: false }))
      console.error('[Wallet] Balance refresh error:', error)
    }
  }, [])

  const requestAirdrop = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))

      // TODO: Replace with real Solana airdrop in production
      // const connection = new Connection(SOLANA_CONFIG.rpcUrl)
      // const airdrop = await connection.requestAirdrop(walletPublicKey, 50 * LAMPORTS_PER_SOL)

      // For hackathon: simulate airdrop by refreshing balance
      await new Promise(resolve => setTimeout(resolve, 2000))

      setState(prev => ({
        ...prev,
        usdc_balance: MOCK_USDC_BALANCE,
        hasReceivedAirdrop: true,
        loading: false,
      }))

      console.log('[Wallet] Airdrop received (simulated)')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Airdrop request failed'
      setState(prev => ({ ...prev, error: message, loading: false }))
      console.error('[Wallet] Airdrop error:', error)
    }
  }, [])

  const withdrawToMPesa = useCallback(async (amount: number, phoneNumber: string) => {
    try {
      if (amount <= 0 || amount > state.usdc_balance) {
        throw new Error('Invalid withdrawal amount')
      }

      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Invalid M-Pesa phone number')
      }

      setState(prev => ({ ...prev, withdrawalPending: true, error: '', withdrawalResult: null }))

      // TODO: Replace with real M-Pesa API call in production
      // import { mpesaWithdraw } from '../backend/mpesa'
      // const result = await mpesaWithdraw({ amount, phoneNumber, userDID })

      // For hackathon: use mock withdrawal
      const result = await mockMPesaWithdrawal(amount, phoneNumber)

      // Update balance
      setState(prev => ({
        ...prev,
        usdc_balance: prev.usdc_balance - amount,
        withdrawalPending: false,
        withdrawalResult: result,
      }))

      console.log('[Wallet] M-Pesa withdrawal successful:', result.reference)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Withdrawal failed'
      setState(prev => ({ ...prev, error: message, withdrawalPending: false }))
      console.error('[Wallet] Withdrawal error:', error)
    }
  }, [state.usdc_balance])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: '' }))
  }, [])

  const resetWithdrawal = useCallback(() => {
    setState(prev => ({ ...prev, withdrawalResult: null }))
  }, [])

  return [
    state,
    {
      refreshBalance,
      requestAirdrop,
      withdrawToMPesa,
      clearError,
      resetWithdrawal,
    },
  ]
}
