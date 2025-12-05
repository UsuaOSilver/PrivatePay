'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'

interface AutoSweepToggleProps {
  walletAddress: string
  salt: string
  initialEnabled?: boolean
}

export function AutoSweepToggle({ walletAddress, salt, initialEnabled = false }: AutoSweepToggleProps) {
  const { address: userAddress } = useAccount()
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (!userAddress) {
      toast.error('Please connect wallet')
      return
    }

    setIsLoading(true)

    try {
      const endpoint = isEnabled ? 'disable-auto-sweep' : 'enable-auto-sweep'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
          owner: userAddress,
          salt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle auto-sweep')
      }

      const newState = !isEnabled
      setIsEnabled(newState)

      if (newState) {
        toast.success('Auto-sweep enabled!', {
          description: 'Funds will be swept automatically within 10 seconds',
        })
      } else {
        toast.info('Auto-sweep disabled', {
          description: 'Use manual sweep button when needed',
        })
      }
    } catch (error) {
      console.error('Error toggling auto-sweep:', error)
      toast.error('Failed to toggle auto-sweep')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="retro-card rounded-xl p-4 border-2 border-[var(--primary)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--primary)] uppercase mb-1">
            ⚡ Auto-Sweep
          </h3>
          <p className="text-xs text-gray-400">
            {isEnabled ? 'Automatic sweep in ~10s' : 'Manual sweep only'}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`
            relative w-16 h-8 rounded-full transition-all duration-300
            ${isEnabled ? 'bg-[var(--success)]' : 'bg-gray-600'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div
            className={`
              absolute top-1 w-6 h-6 rounded-full bg-white
              transition-transform duration-300 shadow-lg
              ${isEnabled ? 'translate-x-9' : 'translate-x-1'}
            `}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
      </div>

      {isEnabled && (
        <div className="mt-3 p-2 bg-[var(--success)]/10 rounded border border-[var(--success)]/30">
          <p className="text-xs text-[var(--success)] font-bold uppercase">
            🎯 Monitoring Active
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Payments received at this address will be automatically swept to your wallet with zero gas fees
          </p>
        </div>
      )}
    </div>
  )
}
