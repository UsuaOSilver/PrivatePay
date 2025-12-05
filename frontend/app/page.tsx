'use client'

import dynamic from 'next/dynamic'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'

const GeneratePayment = dynamic(
  () => import('../components/GeneratePayment').then(mod => ({ default: mod.GeneratePayment })),
  { ssr: false }
)

function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return <ConnectButton />
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f9fa] via-blue-50 to-[#e6f0ff]">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0052ff] to-[#1652f0] bg-clip-text text-transparent">
            PrivatePay
          </h1>
          <WalletButton />
        </nav>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Privacy for Recipients
            </h2>
            <p className="text-lg text-gray-600">
              Accept USDC without revealing your wallet history
            </p>
          </div>

          <GeneratePayment />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              <span className="text-[#0052ff]">Base</span> + <span className="text-[#05b169]">Circle USDC</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
