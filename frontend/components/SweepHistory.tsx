'use client'

import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'

interface SweepEvent {
  id: number
  walletAddress: string
  txHash: string
  amount: string
  timestamp: number
  recipient: string
}

interface SweepHistoryProps {
  walletAddress: string
}

export function SweepHistory({ walletAddress }: SweepHistoryProps) {
  const [history, setHistory] = useState<SweepEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchHistory()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000)
    return () => clearInterval(interval)
  }, [walletAddress])

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sweep-history/${walletAddress}`
      )
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching sweep history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="retro-card rounded-xl p-4 border-2 border-[var(--secondary)]">
        <div className="text-center text-xs text-gray-400">
          Loading history...
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return null
  }

  return (
    <div className="retro-card rounded-xl p-4 border-2 border-[var(--secondary)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[var(--secondary)] uppercase">
              Sweep History
            </h3>
            <p className="text-xs text-gray-400">
              {history.length} sweep{history.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div
          className="text-xl text-[var(--accent)] transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {history.map((event) => {
            const amountUsdc = formatUnits(BigInt(event.amount), 6)
            const date = new Date(event.timestamp).toLocaleString()

            return (
              <div
                key={event.id}
                className="p-3 bg-[#0f0f23] rounded-lg border border-[var(--secondary)]/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--success)]">
                    ✅ Swept
                  </span>
                  <span className="text-xs text-gray-500">{date}</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Amount:</span>
                  <span className="text-sm font-bold text-[var(--success)]">
                    {parseFloat(amountUsdc).toFixed(2)} USDC
                  </span>
                </div>

                <div className="mt-2">
                  <a
                    href={`https://sepolia.basescan.org/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--arcade-blue)] hover:text-[var(--primary)] transition-colors font-mono break-all underline"
                  >
                    {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
