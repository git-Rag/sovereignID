/**
 * Solana Status Dashboard
 * Shows all anchored DIDs with Solscan transaction links
 */

import { useEffect, useState } from 'react'
import { ExternalLink, Loader, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getUserId } from '../lib/config'
import queue from '../lib/queue'

interface AnchorRecord {
  did: string
  timestamp: number
  txSignature: string | null
  explorerUrl: string | null
  status: 'pending' | 'completed' | 'failed'
}

export function SolanaStatusPage() {
  const [anchors, setAnchors] = useState<AnchorRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnchorStatus()
  }, [])

  const loadAnchorStatus = async () => {
    try {
      const userId = await getUserId()
      const txSig = window.localStorage.getItem(`solana-tx-${userId}`)
      const explorerUrl = window.localStorage.getItem(`solana-explorer-url-${userId}`)
      const did = window.localStorage.getItem(`did-${userId}`)

      const completed: AnchorRecord[] = []
      if (txSig && did) {
        completed.push({
          did,
          timestamp: Date.now(),
          txSignature: txSig,
          explorerUrl: explorerUrl || `https://solscan.io/tx/${txSig}?cluster=devnet`,
          status: 'completed',
        })
      }

      // Load pending from queue
      const pending = await queue.getPending()
      const pendingRecords = pending
        .filter(op => op.type === 'anchor')
        .map(op => ({
          did: (op.payload as { did?: string }).did || 'Unknown',
          timestamp: op.createdAt,
          txSignature: null,
          explorerUrl: null,
          status: 'pending' as const,
        }))

      setAnchors([...completed, ...pendingRecords])
    } catch (error) {
      console.error('[SolanaStatus] Failed to load anchor status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Solana Anchors</h1>
        <p className="page-subtitle">Identity registrations on-chain</p>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader size={24} className="animate-spin" />
        </div>
      )}

      {!loading && anchors.length === 0 && (
        <div className="callout-info">
          <AlertTriangle size={18} strokeWidth={1.5} aria-hidden />
          <span>No anchored identities yet. Complete enrollment to anchor your DID.</span>
        </div>
      )}

      {!loading && anchors.length > 0 && (
        <div className="flex flex-col gap-4">
          {anchors.map(anchor => (
            <div key={anchor.txSignature || anchor.did} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="label">DID</p>
                  <p className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {anchor.did}
                  </p>

                  {anchor.txSignature && (
                    <>
                      <p className="label mt-3">Transaction Signature</p>
                      <p className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {anchor.txSignature}
                      </p>
                    </>
                  )}

                  <p className="label mt-3">Status</p>
                  <div className="flex items-center gap-2">
                    {anchor.status === 'completed' && (
                      <>
                        <CheckCircle2 size={16} color="var(--success)" />
                        <span className="text-success">Anchored</span>
                      </>
                    )}
                    {anchor.status === 'pending' && (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span className="text-warning">Pending</span>
                      </>
                    )}
                    {anchor.status === 'failed' && (
                      <>
                        <AlertTriangle size={16} color="var(--error)" />
                        <span className="text-error">Failed</span>
                      </>
                    )}
                  </div>
                </div>

                {anchor.explorerUrl && anchor.status === 'completed' && (
                  <a
                    href={anchor.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ marginTop: 0 }}
                  >
                    <ExternalLink size={16} />
                    Solscan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
