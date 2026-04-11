/**
 * Application Configuration & State Management
 * 
 * Manages user ID, enrollment state, and global settings
 */

import storage from './storage';

export interface AppState {
  userId: string;
  enrolled: boolean;
  didDocument?: Record<string, unknown>;
  guardians?: string[];
  shamir?: {
    shares: string[]; // Encrypted Shamir shares (mnemonics)
    threshold: number;
    total: number;
  };
  createdAt?: string;
}

const DEFAULT_USER_ID = 'user-0001'; // In production, use device unique ID

/**
 * Initialize or retrieve app state
 */
export async function initializeAppState(): Promise<AppState> {
  try {
    const existing = await storage.getState('app-state');

    if (existing && existing.userId) {
      console.log('[AppState] Loaded existing state');
      return {
        userId: (existing.userId as string) || DEFAULT_USER_ID,
        enrolled: (existing.enrolled as boolean) || false,
        didDocument: existing.didDocument as Record<string, unknown>,
        guardians: existing.guardians as string[],
        shamir: existing.shamir as AppState['shamir'],
        createdAt: existing.createdAt as string
      };
    }

    const newState: AppState = {
      userId: DEFAULT_USER_ID,
      enrolled: false,
      createdAt: new Date().toISOString()
    };

    await saveAppState(newState);
    console.log('[AppState] Initialized new state for user:', newState.userId);
    return newState;
  } catch (error) {
    console.error('[AppState] Initialization error:', error);
    // Return default state on error to allow app to continue
    return {
      userId: DEFAULT_USER_ID,
      enrolled: false,
      createdAt: new Date().toISOString()
    };
  }
}

/**
 * Save app state
 */
export async function saveAppState(state: AppState): Promise<void> {
  await storage.setState('app-state', state as unknown as Record<string, unknown>);
}

/**
 * Get current app state
 */
export async function getAppState(): Promise<AppState> {
  const existing = await storage.getState('app-state');
  if (!existing) {
    throw new Error('App state not initialized');
  }
  return {
    userId: (existing.userId as string) || DEFAULT_USER_ID,
    enrolled: (existing.enrolled as boolean) || false,
    didDocument: existing.didDocument as Record<string, unknown>,
    guardians: existing.guardians as string[],
    shamir: existing.shamir as AppState['shamir'],
    createdAt: existing.createdAt as string
  };
}

/**
 * Mark user as enrolled
 */
export async function markEnrolled(didDocument: Record<string, unknown>, guardians: string[]): Promise<void> {
  const state = await getAppState();
  state.enrolled = true;
  state.didDocument = didDocument;
  state.guardians = guardians;
  await saveAppState(state);
  console.log('[AppState] User marked as enrolled');
}

/**
 * Store Shamir shares
 */
export async function storeShamirShares(shares: string[], threshold: number, total: number): Promise<void> {
  const state = await getAppState();
  state.shamir = { shares, threshold, total };
  await saveAppState(state);
  console.log(`[AppState] Stored ${total} Shamir shares (${threshold}-of-${total} recovery)`);
}

/**
 * Get user ID
 */
export async function getUserId(): Promise<string> {
  const state = await getAppState();
  return state.userId;
}

/**
 * Check if user is enrolled
 */
export async function isEnrolled(): Promise<boolean> {
  const state = await getAppState();
  return state.enrolled;
}

/**
 * Get DID document
 */
export async function getDIDDocument(): Promise<Record<string, unknown> | undefined> {
  const state = await getAppState();
  return state.didDocument;
}
