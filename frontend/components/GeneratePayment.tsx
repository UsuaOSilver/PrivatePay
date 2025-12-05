'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

export function GeneratePayment() {
  const { address, isConnected } = useAccount()
  const [paymentAddress, setPaymentAddress] = useState<string>('')
  const [salt, setSalt] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-6">💰</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Loading...
          </h3>
        </div>
      </div>
    )
  }

  const generateAddress = async () => {
    if (!address) {
      toast.error('🔐 Connect your wallet first!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compute-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: address })
      })

      if (!response.ok) {
        throw new Error('Failed to generate address')
      }

      const data = await response.json()
      setPaymentAddress(data.wallet_address)
      setSalt(data.salt)
      toast.success('🎉 Your private payment address is ready!')
    } catch (error) {
      toast.error('😔 Oops! Something went wrong. Try again?')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(paymentAddress)
    toast.success('📋 Copied! Share it with your customers')
  }

  const shareAddress = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pay me on PrivatePay',
        text: `Send USDC to my private address: ${paymentAddress}`,
        url: window.location.href
      })
    } else {
      copyAddress()
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-lg p-10 border-2 border-[#0052ff]/20">
        <div className="text-center">
          <div className="text-7xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold text-gray-900">
            Connect Wallet
          </h3>
        </div>
      </div>
    )
  }

  if (!paymentAddress) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <div className="text-center">
          <div className="text-7xl mb-8">💰</div>

          <button
            onClick={generateAddress}
            disabled={loading}
            className="bg-gradient-to-r from-[#0052ff] to-[#1652f0] text-white text-xl font-semibold px-12 py-5 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Address'
            )}
          </button>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex justify-center gap-12 text-center">
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-medium text-gray-600">Instant</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-sm font-medium text-gray-600">Private</div>
              </div>
              <div>
                <div className="text-3xl mb-2">💸</div>
                <div className="text-sm font-medium text-gray-600">Free</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[#05b169]/10 text-[#05b169] px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
          ✨ Ready
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          Payment Address
        </h3>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-[#0052ff]/10">
          <QRCodeSVG
            value={paymentAddress}
            size={220}
            level="H"
            includeMargin={true}
            fgColor="#0052ff"
          />
        </div>
      </div>

      {/* Address Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6">
        <div className="font-mono text-sm text-gray-900 break-all leading-relaxed text-center">
          {paymentAddress}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={copyAddress}
          className="flex-1 bg-[#0052ff] text-white font-semibold py-4 rounded-xl hover:bg-[#0041cc] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          📋 Copy
        </button>
        <button
          onClick={shareAddress}
          className="flex-1 bg-[#05b169] text-white font-semibold py-4 rounded-xl hover:bg-[#049457] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
        >
          🚀 Share
        </button>
      </div>

      {/* Generate Another */}
      <button
        onClick={() => {
          setPaymentAddress('')
          setSalt('')
        }}
        className="w-full text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all active:scale-95 text-sm"
      >
        Generate Another
      </button>
    </div>
  )
}
