'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatAddressWithBasename, getFarcasterUsername } from '@/lib/basename'

interface Activity {
  type: 'sent' | 'received' | 'link_created'
  amount?: string
  from?: string
  to?: string
  timestamp: number
  txHash?: string
  description?: string
  basename?: string
  farcasterUsername?: string
}

export function ActivityFeed() {
  const { address } = useAccount()
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Mock activity data with social identities
    const mockActivities: Activity[] = [
      {
        type: 'received',
        amount: '10.50',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        basename: 'alice.base.eth',
        farcasterUsername: 'alice',
        timestamp: Date.now() - 1000 * 60 * 5, // 5 min ago
        txHash: '0xabc123...'
      },
      {
        type: 'link_created',
        amount: '25.00',
        description: 'Coffee ☕',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
      },
      {
        type: 'sent',
        amount: '5.00',
        to: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
        basename: 'bob.base.eth',
        farcasterUsername: 'bob',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        txHash: '0xdef456...'
      }
    ]

    setActivities(mockActivities)
  }, [address])

  if (activities.length === 0) {
    return (
      <div className="retro-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-gray-400 text-sm">No activity yet</p>
        <p className="text-gray-500 text-xs mt-2">Your transactions will appear here</p>
      </div>
    )
  }

  return (
    <div className="retro-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[var(--foreground)] uppercase flex items-center gap-2">
          <span>📊</span>
          <span>Recent Activity</span>
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-[var(--arcade-blue)] rounded-full animate-pulse"></div>
          <span>Base Sepolia</span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="bg-[#1a1a3e] rounded-xl p-4 border border-gray-700 hover:border-[var(--primary)]/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Activity Icon */}
                  <div className="text-2xl">
                    {activity.type === 'received' && '💸'}
                    {activity.type === 'sent' && '📤'}
                    {activity.type === 'link_created' && '🔗'}
                  </div>

                  {/* Activity Details */}
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)]">
                      {activity.type === 'received' && 'Received'}
                      {activity.type === 'sent' && 'Sent'}
                      {activity.type === 'link_created' && 'Payment Link Created'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                {activity.amount && (
                  <div className="ml-11">
                    <p className="text-lg font-bold text-[var(--success)]">
                      ${activity.amount} USDC
                    </p>
                  </div>
                )}

                {/* Address or Description with Social Identity */}
                <div className="ml-11 mt-1">
                  {activity.from && (
                    <div className="flex items-center gap-2">
                      {activity.farcasterUsername && (
                        <a
                          href={`https://warpcast.com/${activity.farcasterUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--primary)] transition-colors"
                        >
                          <span className="font-bold">@{activity.farcasterUsername}</span>
                          <span className="text-[10px]">🟣</span>
                        </a>
                      )}
                      {activity.basename && !activity.farcasterUsername && (
                        <span className="text-xs font-bold text-[var(--primary)]">
                          {activity.basename}
                        </span>
                      )}
                      {!activity.basename && !activity.farcasterUsername && (
                        <span className="text-xs text-gray-500 font-mono">
                          from {activity.from.slice(0, 8)}...{activity.from.slice(-6)}
                        </span>
                      )}
                    </div>
                  )}
                  {activity.to && (
                    <div className="flex items-center gap-2">
                      {activity.farcasterUsername && (
                        <a
                          href={`https://warpcast.com/${activity.farcasterUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--primary)] transition-colors"
                        >
                          <span className="font-bold">@{activity.farcasterUsername}</span>
                          <span className="text-[10px]">🟣</span>
                        </a>
                      )}
                      {activity.basename && !activity.farcasterUsername && (
                        <span className="text-xs font-bold text-[var(--primary)]">
                          {activity.basename}
                        </span>
                      )}
                      {!activity.basename && !activity.farcasterUsername && (
                        <span className="text-xs text-gray-500 font-mono">
                          to {activity.to.slice(0, 8)}...{activity.to.slice(-6)}
                        </span>
                      )}
                    </div>
                  )}
                  {activity.description && (
                    <p className="text-xs text-gray-400">
                      {activity.description}
                    </p>
                  )}
                </div>

                {/* Transaction Link */}
                {activity.txHash && (
                  <div className="ml-11 mt-2">
                    <a
                      href={`https://sepolia.basescan.org/tx/${activity.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--arcade-blue)] hover:text-[var(--primary)] underline"
                    >
                      View on Basescan →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Powered by Base badge */}
      <div className="mt-6 pt-4 border-t border-gray-700 text-center">
        <a
          href="https://base.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-[var(--arcade-blue)] transition-colors"
        >
          <span>⚡</span>
          <span>Powered by Base</span>
        </a>
      </div>
    </div>
  )
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
