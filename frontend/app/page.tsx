'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'

const GeneratePayment = dynamic(
  () => import('../components/GeneratePayment').then(mod => ({ default: mod.GeneratePayment })),
  { ssr: false }
)

const CreatePaymentLink = dynamic(
  () => import('../components/CreatePaymentLink').then(mod => ({ default: mod.CreatePaymentLink })),
  { ssr: false }
)

const WalletHistory = dynamic(
  () => import('../components/WalletHistory').then(mod => ({ default: mod.WalletHistory })),
  { ssr: false }
)

const ActivityFeed = dynamic(
  () => import('../components/ActivityFeed').then(mod => ({ default: mod.ActivityFeed })),
  { ssr: false }
)

const SmartWalletConnect = dynamic(
  () => import('../components/SmartWalletConnect').then(mod => ({ default: mod.SmartWalletConnect })),
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
  const { address, isConnected } = useAccount()
  const [selectedWallet, setSelectedWallet] = useState<{ address: string; salt: string } | null>(null)
  const [mode, setMode] = useState<'home' | 'receive' | 'request'>('home')

  // Show landing page if not connected
  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Left side - "Flip USDC to Anyone, Instantly" - moving up */}
        <div className="absolute left-4 md:left-12 top-0 h-full flex items-center">
          <div className="animate-scroll-up">
            <p className="text-2xl md:text-4xl font-bold text-[var(--foreground)] writing-mode-vertical transform -rotate-180 whitespace-nowrap"
               style={{ writingMode: 'vertical-rl' }}>
              Flip USDC to Anyone, Instantly
            </p>
          </div>
        </div>

        {/* Right side - "Gas-free payments on Base" - moving down */}
        <div className="absolute right-4 md:right-12 top-0 h-full flex items-center">
          <div className="animate-scroll-down">
            <p className="text-lg md:text-2xl text-gray-400 writing-mode-vertical transform -rotate-180 whitespace-nowrap"
               style={{ writingMode: 'vertical-rl' }}>
              Gas-free payments on Base
            </p>
          </div>
        </div>

        {/* Center content */}
        <div className="max-w-xl w-full text-center z-10">
          <div className="text-8xl mb-8 animate-bounce">🪙</div>
          <h1 className="text-4xl font-bold uppercase tracking-wider mb-8 bg-gradient-to-r from-[var(--arcade-pink)] via-[var(--primary)] to-[var(--arcade-purple)] text-transparent bg-clip-text neon-text-gradient">
            Coinflip
          </h1>
          <div className="flex justify-center">
            <SmartWalletConnect />
          </div>
        </div>
      </main>
    )
  }

  // Home screen with Send/Request buttons
  if (mode === 'home') {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex justify-between items-center mb-12">
            <h1 className="neon-text text-2xl font-bold text-[var(--primary)] uppercase tracking-wider">
              🪙 Coinflip
            </h1>
            <WalletButton />
          </nav>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm text-gray-400">
                Choose an action to get started
              </p>
            </div>

            {/* Main Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Private Receive Card */}
              <button
                onClick={() => setMode('receive')}
                className="retro-card rounded-2xl p-8 border-2 border-[var(--primary)] hover:border-[var(--success)] transition-all hover:scale-105 active:scale-100"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">💰</div>
                  <h3 className="text-xl font-bold text-[var(--primary)] mb-2 uppercase">
                    Private QR
                  </h3>
                  <p className="text-sm text-gray-400">
                    Get a new address with QR code to receive USDC privately
                  </p>
                </div>
              </button>

              {/* Payment link Card */}
              <button
                onClick={() => setMode('request')}
                className="retro-card rounded-2xl p-8 border-2 border-[var(--accent)] hover:border-[var(--success)] transition-all hover:scale-105 active:scale-100"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">🔗</div>
                  <h3 className="text-xl font-bold text-[var(--accent)] mb-2 uppercase">
                    Payment link 
                  </h3>
                  <p className="text-sm text-gray-400">
                    Create a Farcaster payment link 
                  </p>
                </div>
              </button>
            </div>

            {/* Activity Feed */}
            <div className="mb-8">
              <ActivityFeed />
            </div>

            {/* Wallet History */}
            <WalletHistory onSelectWallet={(address, salt) => setSelectedWallet({ address, salt })} />

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

  // Receive Money Flow
  if (mode === 'receive') {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex justify-between items-center mb-8">
            <button
              onClick={() => setMode('home')}
              className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--success)] transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-bold uppercase text-sm">Back</span>
            </button>
            <WalletButton />
          </nav>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 uppercase">
                Receive USDC
              </h2>
              <p className="text-sm text-gray-400">
                Share your QR code or address
              </p>
            </div>

            <GeneratePayment />
          </div>
        </div>
      </main>
    )
  }

  // Request Payment Flow
  if (mode === 'request') {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex justify-between items-center mb-8">
            <button
              onClick={() => setMode('home')}
              className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--success)] transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-bold uppercase text-sm">Back</span>
            </button>
            <WalletButton />
          </nav>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 uppercase">
                Request Payment
              </h2>
              <p className="text-sm text-gray-400">
                Create a payment link with your amount
              </p>
            </div>

            <CreatePaymentLink />
          </div>
        </div>
      </main>
    )
  }

  return null
}
