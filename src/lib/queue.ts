/**
 * Offline Operation Queue
 * 
 * Persists pending operations (Solana anchoring, etc.) in IndexedDB.
 * Automatically drains queue when online.
 * 
 * Used by enrollment and recovery flows to queue operations
 * that require internet connectivity.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OperationQueueDB extends DBSchema {
  queue: {
    key: string
    value: {
      id: string
      type: 'anchor' | 'sync' | 'issue_credential'
      payload: unknown
      createdAt: number
      retries: number
      maxRetries: number
      lastError?: string
    }
  }
}

class OfflineQueue {
  private db: IDBPDatabase<OperationQueueDB> | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  async init(): Promise<void> {
    try {
      this.db = await openDB<OperationQueueDB>('sovereign-queue', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('queue')) {
            db.createObjectStore('queue', { keyPath: 'id' })
          }
        },
      })
      console.log('[OfflineQueue] Initialized')
    } catch (error) {
      // IndexedDB might not be available in some contexts
      // Queue operations will still work but won't persist
      console.warn('[OfflineQueue] IndexedDB not available:', error)
      // Don't throw - allow app to continue
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      window.addEventListener('reconnect', () => this.drainQueue())
    }
  }

  private handleOnline(): void {
    console.log('[OfflineQueue] Device came online')
    this.isOnline = true
    this.drainQueue()
  }

  private handleOffline(): void {
    console.log('[OfflineQueue] Device went offline')
    this.isOnline = false
  }

  /**
   * Add operation to queue
   */
  async add(
    type: 'anchor' | 'sync' | 'issue_credential',
    payload: unknown,
    maxRetries = 5
  ): Promise<string> {
    if (!this.db) {
      try {
        await this.init()
      } catch {
        // IndexedDB not available, still return a valid ID
        console.warn('[OfflineQueue] Could not initialize DB, operation will not persist')
      }
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const operation = {
      id,
      type,
      payload,
      createdAt: Date.now(),
      retries: 0,
      maxRetries,
    }

    // Only persist if DB is available
    if (this.db) {
      try {
        await this.db.add('queue', operation)
      } catch (error) {
        console.error('[OfflineQueue] Failed to add operation to DB:', error)
      }
    }
    
    console.log(`[OfflineQueue] Added ${type} operation:`, id)

    // If online, process immediately
    if (this.isOnline) {
      this.drainQueue()
    }

    return id
  }

  /**
   * Query pending operations
   */
  async getPending(): Promise<OperationQueueDB['queue']['value'][]> {
    if (!this.db) {
      try {
        await this.init()
      } catch {
        return []
      }
    }
    if (!this.db) return []
    try {
      return await this.db.getAll('queue')
    } catch {
      return []
    }
  }

  /**
   * Manually retry a single operation
   */
  async retry(operationId: string): Promise<boolean> {
    if (!this.db) {
      try {
        await this.init()
      } catch {
        return false
      }
    }
    if (!this.db) return false

    try {
      const op = await this.db.get('queue', operationId)
      if (!op) return false
      return await this.processOperation(op)
    } catch {
      return false
    }
  }

  /**
   * Drain queue — process all pending operations
   */
  async drainQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('[OfflineQueue] Offline — queue drain skipped')
      return
    }

    if (!this.db) {
      try {
        await this.init()
      } catch {
        console.warn('[OfflineQueue] Cannot drain queue: IndexedDB unavailable')
        return
      }
    }

    if (!this.db) return

    try {
      const pending = await this.db.getAll('queue')
      console.log(`[OfflineQueue] Draining queue: ${pending.length} pending operations`)

      for (const op of pending) {
        const success = await this.processOperation(op)
        if (success) {
          await this.db.delete('queue', op.id)
          console.log(`[OfflineQueue] ✅ Completed: ${op.id}`)
        } else {
          // Retry later
          op.retries += 1
          if (op.retries >= op.maxRetries) {
            console.error(`[OfflineQueue] ❌ Max retries exceeded: ${op.id}`, op.lastError)
            await this.db.delete('queue', op.id)
          } else {
            await this.db.put('queue', op)
          }
        }
      }
    } catch (error) {
      console.error('[OfflineQueue] Queue drain failed:', error)
    }
  }

  /**
   * Process a single operation
   *
   * Delegates to specific handlers based on operation type
   */
  private async processOperation(
    op: OperationQueueDB['queue']['value']
  ): Promise<boolean> {
    try {
      switch (op.type) {
        case 'anchor':
          return await this.handleAnchor(op.payload)
        case 'sync':
          return await this.handleSync(op.payload)
        case 'issue_credential':
          return await this.handleIssueCredential(op.payload)
        default:
          console.warn('[OfflineQueue] Unknown operation type:', op.type)
          return false
      }
    } catch (error) {
      op.lastError = error instanceof Error ? error.message : String(error)
      console.error(`[OfflineQueue] Operation failed: ${op.id}`, op.lastError)
      return false
    }
  }

  /**
   * Handle anchor operation (Solana)
   */
  private async handleAnchor(payload: unknown): Promise<boolean> {
    // Use simulated anchoring for demo
    const { anchorDIDSimulated } = await import('./solanaDemo')

    try {
      if (typeof payload !== 'object' || payload === null) {
        throw new Error('Invalid anchor payload')
      }

      const didPayload = payload as { did?: string }
      if (!didPayload.did) {
        throw new Error('DID not provided in payload')
      }

      const result = await anchorDIDSimulated(didPayload.did)

      console.log('[OfflineQueue] Anchor successful:', result.txHash)
      return true
    } catch (error) {
      console.error('[OfflineQueue] Anchor failed:', error)
      return false
    }
  }

  /**
   * Handle sync operation (Bluetooth)
   */
  private async handleSync(payload: unknown): Promise<boolean> {
    // TODO: Implement Bluetooth sync
    console.log('[OfflineQueue] Sync stub (TODO):', payload)
    return true
  }

  /**
   * Handle credential issuance
   */
  private async handleIssueCredential(payload: unknown): Promise<boolean> {
    // TODO: Implement credential issuance
    console.log('[OfflineQueue] Issue credential stub (TODO):', payload)
    return true
  }

  /**
   * Clear entire queue (use cautiously)
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.clear('queue')
    console.log('[OfflineQueue] Queue cleared')
  }
}

// Singleton instance
const queue = new OfflineQueue()

export default queue
