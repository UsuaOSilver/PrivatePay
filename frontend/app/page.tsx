'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-gray-900">PrivatePay</h1>
          <ConnectButton />
        </nav>

        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Privacy for Recipients
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Accept USDC payments without revealing your wallet history to customers.
          </p>
          <p className="text-lg text-gray-500 mb-12">
            The first privacy tool designed for people getting paid, not just paying.
          </p>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-2xl font-semibold mb-4">Coming Soon</h3>
            <ul className="text-left space-y-3 text-gray-600">
              <li>✅ Generate payment addresses with QR codes</li>
              <li>✅ Auto-detect USDC payments</li>
              <li>✅ One-click sweep to your real wallet</li>
              <li>✅ Complete privacy from customers</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
