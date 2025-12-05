'use client'

import { useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function SmartWalletConnect() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const [showOptions, setShowOptions] = useState(false)

  if (isConnected) return null

  // Show initial "Get Started" button
  if (!showOptions) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowOptions(true)}
          type="button"
          className="w-full bg-[#0a0a0a] text-[#ff0033] px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide hover:scale-105 active:scale-100 transition-all border-4 border-[#ff0033] shadow-[0_0_30px_#ff0033,0_0_60px_#ff0033,0_0_90px_#ff003388] hover:shadow-[0_0_40px_#ff0033,0_0_80px_#ff0033,0_0_120px_#ff003388] hover:bg-[#ff0033]/15 animate-pulse"
          style={{
            boxShadow: '0 0 30px #ff0033, 0 0 60px #ff0033, 0 0 90px rgba(255, 0, 51, 0.5), inset 0 0 20px rgba(255, 0, 51, 0.1)'
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🚀</span>
            <span>Get Started</span>
          </span>
        </button>

        {/* Trust indicator */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xxs text-gray-400 text-center">
            Powered by Coinbase
          </p>
        </div>
      </div>
    )
  }

  // Show 2 simple options after clicking "Get Started"
  return (
    <div className="space-y-4 max-w-md">
      {/* Option 1: Create New Wallet (Opens RainbowKit with Coinbase first) */}
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            className="w-full bg-[#1a1a3e] text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wide hover:scale-105 active:scale-100 transition-all border-2 border-gray-600 hover:border-[var(--primary)]"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🚧🚧🚧</div>
              <div className="text-base mb-1">Create New Wallet</div>
              <div className="text-xs font-normal opacity-80">
                🚧🚧...in construction...🚧🚧
              </div>
            </div>
          </button>
        )}
      </ConnectButton.Custom>

      {/* Option 2: I Have a Wallet (RainbowKit Modal) */}
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            className="w-full bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wide hover:scale-105 active:scale-100 transition-all border-2 border-[#0052FF] shadow-[0_0_20px_rgba(0,82,255,0.5)]"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🔗</div>
              <div className="text-base mb-1">I Have a Wallet</div>
            </div>
          </button>
        )}
      </ConnectButton.Custom>

      {/* Trust indicator */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xxs text-gray-400 text-center">
          Powered by Coinbase
        </p>
      </div>
    </div>
  )
}
