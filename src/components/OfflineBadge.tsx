/**
 * OfflineBadge Component
 *
 * Shows persistent online/offline status in top-right corner.
 * Helps users understand connectivity state and why operations are queued.
 */

import React from 'react'
import { WifiOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'
import '../styles/offline-badge.css'

export function OfflineBadge(): React.ReactNode {
  const { isOnline } = useOnline()

  if (isOnline) {
    // Don't show badge when online
    return null
  }

  return (
    <div className="offline-badge" role="status" aria-labelledby="offline-badge-label">
      <WifiOff size={16} strokeWidth={2} className="offline-badge__icon" />
      <span id="offline-badge-label" className="offline-badge__text">
        Offline
      </span>
    </div>
  )
}
