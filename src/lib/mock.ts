/**
 * Mock Data & Constants for Hackathon Demo
 * 
 * DO NOT use these values in production.
 * This file centralizes all demo/mock values to make them easy to remove.
 */

/**
 * Mock USDC balance for demo
 * 
 * In production: query SPL token account on Solana
 * For hackathon: return static mock value simulating aid airdrop
 */
export const MOCK_USDC_BALANCE = 50.0

/**
 * Mock M-Pesa withdrawal response
 * 
 * In production: call real M-Pesa API via backend relayer
 * For hackathon: simulate successful withdrawal
 */
export async function mockMPesaWithdrawal(
  amount: number,
  phoneNumber: string
): Promise<{ success: boolean; reference: string; message: string }> {
  // Simulate 3-second processing time
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        reference: `MP${Date.now()}`,
        message: `Withdrawal of ${amount} KES to ${phoneNumber} successful`,
      })
    }, 3000)
  })
}

/**
 * Mock credential issuance
 * 
 * In production: Backend NGO signs actual W3C Verifiable Credentials
 * For hackathon: Return demo credential
 */
export function mockIssueCredential(
  holderDID: string,
  credentialType: 'identity' | 'age_proof_over_18' | 'age_proof_over_16'
) {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', credentialType],
    issuer: 'did:key:demo-issuer',
    credentialSubject: {
      id: holderDID,
      type: credentialType,
      issuedAt: new Date().toISOString(),
    },
    proof: {
      type: 'BbsBlsSignature2020',
      nonce: 'mock',
      proofValue: 'mock-proof-' + Math.random().toString(36).slice(2),
    },
  }
}

/**
 * Mock cryptographic proof (should be replaced with real snarkjs)
 * 
 * In production: Use real Groth16 circuit outputs
 */
export function mockZKProof(
  statement: 'age_over_18' | 'age_over_16'
): { proof: string; publicSignals: string[] } {
  return {
    proof: `mock-proof-${statement}-${Date.now()}`,
    publicSignals: ['1'], // 1 = true
  }
}

/**
 * Guardian names for demo (remove in production)
 */
export const DEMO_GUARDIAN_NAMES = [
  'Mama Kofi',
  'Sister Amara',
  'Brother James',
  'Aunt Zainab',
  'Uncle Omar',
]

/**
 * Sample credentials for empty state
 */
export const EMPTY_CREDENTIAL_STATE = {
  title: 'No credentials yet',
  description: 'Request or receive credentials from trusted issuers',
}

/**
 * Enrollment step titles
 */
export const ENROLLMENT_STEPS = [
  'Take Selfie',
  'Confirm Identity',
  'Set Guardians',
  'Anchor Identity',
  'Ready to Go',
]

/**
 * Development/Debug constants
 */
export const DEV_CONSTANTS = {
  // Show verbose logging in console during enrollment
  DEBUG_ENROLLMENT: false,

  // Simulate slow network for testing
  SIMULATE_SLOW_NETWORK: false,
  SIMULATED_DELAY_MS: 3000,

  // Skip biometric verification (face-api.js)
  SKIP_BIOMETRIC: false,

  // Use mock Solana instead of real devnet
  USE_MOCK_SOLANA: false,

  // Print secrets to console (NEVER in production)
  LOG_SECRETS: false,
}
