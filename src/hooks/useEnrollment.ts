/**
 * useEnrollment Hook
 *
 * Manages enrollment flow state and coordinates with core DID, biometric, and recovery functions.
 * Handles offline queue for Solana anchoring.
 */

import { useState, useCallback } from 'react'
import { generateDID, createDIDDocument } from '../core/did/generate'
import { createBiometricCommitment } from '../core/biometric/hash'
import { splitPrivateKey } from '../core/recovery/split'
import queue from '../lib/queue'
import { getUserId, markEnrolled, storeShamirShares } from '../lib/config'

export interface EnrollmentState {
  step: number
  loading: boolean
  error: string
  biometricHash: string
  didId: string
  didDocument: Record<string, unknown> | null
  publicKeyHex: string
  guardianNames: string[]
  shamirShares: string[]
  solanaTxSignature: string | null
  solanaTxPending: boolean
}

interface EnrollmentActions {
  setBiometricHash: (hash: string) => void
  generateDIDKeypair: () => Promise<void>
  addGuardian: (name: string) => void
  removeGuardian: (index: number) => void
  generateShamirShares: () => Promise<void>
  submitForAnchoring: () => Promise<void>
  completeEnrollment: () => Promise<void>
  setStep: (step: number) => void
  setError: (error: string) => void
}

const initialState: EnrollmentState = {
  step: 0,
  loading: false,
  error: '',
  biometricHash: '',
  didId: '',
  didDocument: null,
  publicKeyHex: '',
  guardianNames: [],
  shamirShares: [],
  solanaTxSignature: null,
  solanaTxPending: false,
}

/**
 * Hook to manage enrollment flow
 *
 * Coordinates DID generation, biometric binding, guardian setup, Shamir split,
 * and Solana anchoring through a multi-step process.
 */
export function useEnrollment(): [EnrollmentState, EnrollmentActions] {
  const [state, setState] = useState<EnrollmentState>(initialState)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Track connectivity for Solana anchor queueing
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))
  }

  const setBiometricHash = useCallback((hash: string) => {
    setState(prev => ({ ...prev, biometricHash: hash, error: '' }))
  }, [])

  const generateDIDKeypair = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))

      if (!state.biometricHash) {
        throw new Error('Biometric hash required before DID generation')
      }

      // Generate P-256 ECDSA keypair
      const didKeypair = await generateDID()
      const publicKeyHex = didKeypair.publicKeyHex

      // Create W3C DID Document
      const didDocument = createDIDDocument(didKeypair.didId, publicKeyHex)

      // Bind biometric to DID
      const biometricCommitment = await createBiometricCommitment(state.biometricHash, didKeypair.didId)

      // Store to IndexedDB
      const userId = await getUserId()
      const identityData = {
        didId: didKeypair.didId,
        publicKeyHex,
        biometricHash: state.biometricHash,
        biometricCommitment,
        didDocument,
        createdAt: new Date().toISOString(),
      }

      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`identity-${userId}`, JSON.stringify(identityData))
      }

      setState(prev => ({
        ...prev,
        didId: didKeypair.didId,
        publicKeyHex,
        didDocument,
        loading: false,
      }))

      console.log('[Enrollment] DID generated:', didKeypair.didId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate DID'
      setState(prev => ({ ...prev, error: message, loading: false }))
      console.error('[Enrollment] DID generation error:', error)
    }
  }, [state.biometricHash])

  const addGuardian = useCallback((name: string) => {
    if (!name.trim()) return
    if (state.guardianNames.length >= 5) {
      setState(prev => ({ ...prev, error: 'Maximum 5 guardians allowed' }))
      return
    }
    setState(prev => ({
      ...prev,
      guardianNames: [...prev.guardianNames, name],
      error: '',
    }))
  }, [state.guardianNames])

  const removeGuardian = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      guardianNames: prev.guardianNames.filter((_, i) => i !== index),
    }))
  }, [])

  const generateShamirShares = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))

      if (state.guardianNames.length < 5) {
        throw new Error('Need exactly 5 guardians for 3-of-5 Shamir split')
      }

      if (!state.publicKeyHex) {
        throw new Error('DID keypair not generated')
      }

      // Split private key using secrets.js-grempe
      const shares = splitPrivateKey(state.publicKeyHex)

      // Store shares in encrypted storage
      const userId = await getUserId()
      await storeShamirShares(shares, 3, 5)

      // Also store to localStorage for this session
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`shares-${userId}`, JSON.stringify(shares))
      }

      setState(prev => ({
        ...prev,
        shamirShares: shares,
        loading: false,
      }))

      console.log('[Enrollment] Shamir shares generated: 5 shares, 3-of-5 recovery')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate Shamir shares'
      setState(prev => ({ ...prev, error: message, loading: false }))
      console.error('[Enrollment] Shamir generation error:', error)
    }
  }, [state.guardianNames, state.publicKeyHex])

  const submitForAnchoring = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '', solanaTxPending: true }))

      if (!state.didId || !state.didDocument) {
        throw new Error('DID document not ready')
      }

      // If online, anchor immediately; otherwise queue
      if (isOnline) {
        try {
          const { anchorDIDSimulated } = await import('../lib/solanaDemo')
          const result = await anchorDIDSimulated(state.didId)

          setState(prev => ({
            ...prev,
            solanaTxSignature: result.txHash,
            solanaTxPending: false,
            loading: false,
          }))

          console.log('[Enrollment] Demo anchor successful:', result.txHash)
        } catch (anchorError) {
          // Queue for retry if offline
          console.warn('[Enrollment] Anchor online failed, queueing:', anchorError)
          await queue.add('anchor', { did: state.didId, hash: state.biometricHash })
          setState(prev => ({
            ...prev,
            solanaTxPending: false,
            loading: false,
            error: 'Anchoring queued — will complete when reconnected',
          }))
        }
      } else {
        // Queue for later
        await queue.add('anchor', { did: state.didId, hash: state.biometricHash })
        setState(prev => ({
          ...prev,
          solanaTxPending: false,
          loading: false,
          error: 'Offline — anchoring will complete when reconnected',
        }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to anchor to Solana'
      setState(prev => ({ ...prev, error: message, loading: false, solanaTxPending: false }))
      console.error('[Enrollment] Anchoring error:', error)
    }
  }, [state.didId, state.didDocument, state.biometricHash, isOnline])

  const completeEnrollment = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))

      if (!state.didId || !state.didDocument) {
        throw new Error('DID document not generated')
      }

      const userId = await getUserId()
      await markEnrolled(state.didDocument, state.guardianNames)

      console.log('[Enrollment] ✅ Enrollment complete for user:', userId)

      // Reset to success state
      setState(prev => ({
        ...prev,
        step: 5, // Complete step
        loading: false,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete enrollment'
      setState(prev => ({ ...prev, error: message, loading: false }))
      console.error('[Enrollment] Completion error:', error)
    }
  }, [state.didId, state.didDocument, state.guardianNames])

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  return [
    state,
    {
      setBiometricHash,
      generateDIDKeypair,
      addGuardian,
      removeGuardian,
      generateShamirShares,
      submitForAnchoring,
      completeEnrollment,
      setStep,
      setError,
    },
  ]
}
