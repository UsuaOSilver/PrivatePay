'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'

const CreatePaymentLink = dynamic(
  () => import('../components/CreatePaymentLink').then(mod => ({ default: mod.CreatePaymentLink })),
  { ssr: false }
)

const WalletHistory = dynamic(
  () => import('../components/WalletHistory').then(mod => ({ default: mod.WalletHistory })),
  { ssr: false }
)

function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-[#1a1a3e] px-4 py-2 rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] font-mono text-xs shadow-[0_0_15px_var(--primary-glow)]">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="arcade-button bg-gradient-to-r from-[var(--danger)] to-[#ff3399] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return <ConnectButton />
}

export default function Home() {
  const [selectedWallet, setSelectedWallet] = useState<{ address: string; salt: string } | null>(null)

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-12">
          <h1 className="neon-text text-2xl font-bold text-[var(--primary)] uppercase tracking-wider">
            🪙 Coinflip
          </h1>
          <WalletButton />
        </nav>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3 uppercase tracking-wide leading-relaxed">
              Flip USDC to Anyone, Instantly
            </h2>
            <p className="text-xs text-gray-500">
              Gas-free USDC payments on Base
            </p>
          </div>

          <WalletHistory onSelectWallet={(address, salt) => setSelectedWallet({ address, salt })} />

          <CreatePaymentLink />

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              <span className="text-[var(--arcade-blue)]">Base</span> + <span className="text-[var(--success)]">Circle USDC</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
