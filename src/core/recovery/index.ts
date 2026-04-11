/**
 * Social Recovery (secrets.js)
 * 
 * TODO: SLIP-0039 Shamir Secret Sharing for 3-of-5 guardian recovery
 * - Split recovery key into 5 shares using secrets.js
 * - Hard rule: Shares are never transmitted digitally
 * - Display as 20-word mnemonics for manual transcription
 * - QR recovery initiation + Bluetooth-based guardian approval
 * - Guardian flow for accepting/denying recovery requests
 */

export interface Guardian {
  id: string;
  name: string;
  contact: string; // Phone, email, or DID
  share?: string; // Mnemonic share (displayed only, not stored)
}

export async function generateRecoveryKey(): Promise<ArrayBuffer> {
  // TODO: Generate random recovery key material
  throw new Error('Not yet implemented');
}

export async function splitRecoveryKeyShares(
  _recoveryKey: ArrayBuffer,
  _guardianCount: number,
  _threshold: number
): Promise<string[]> {
  // TODO: Use secrets.js for SLIP-0039 splitting
  // Hard rule: Never transmitted digitally
  // TODO: Return mnemonics for display only
  throw new Error('Not yet implemented');
}

export async function reconstructRecoveryKey(_shares: string[]): Promise<ArrayBuffer> {
  // TODO: Reconstruct recovery key from 3+ shares
  throw new Error('Not yet implemented');
}

export async function initiateRecoveryFlow(_guardians: Guardian[]): Promise<string> {
  // TODO: Generate recovery QR code
  // TODO: Await Bluetooth confirmation from 3+ guardians
  throw new Error('Not yet implemented');
}
