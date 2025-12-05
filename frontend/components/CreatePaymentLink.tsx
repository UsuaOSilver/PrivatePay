'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

export function CreatePaymentLink() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState<{
    id: string
    url: string
    expiresAt?: number
  } | null>(null)

  const createLink = async () => {
    if (!address) {
      toast.error('Connect your wallet first!')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_address: address,
          amount: (parseFloat(amount) * 1_000_000).toString(), // Convert to 6 decimals
          description: description || undefined,
          expires_in_hours: 24,
          max_claims: 1,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment link')
      }

      const data = await response.json()
      const linkUrl = `${window.location.origin}/pay/${data.link.id}`

      setCreatedLink({
        id: data.link.id,
        url: linkUrl,
        expiresAt: data.link.expiresAt,
      })

      toast.success('Payment link created!')
    } catch (error) {
      toast.error('Failed to create payment link')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.url)
      toast.success('Link copied!')
    }
  }

  const resetForm = () => {
    setCreatedLink(null)
    setAmount('')
    setDescription('')
  }

  if (!isConnected) {
    return (
      <div className="retro-card rounded-2xl p-8 border-2 border-[var(--accent)]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-[var(--accent)] mb-2 uppercase">
            Payment Links
          </h3>
          <p className="text-sm text-gray-400">
            Connect your wallet to create payment links
          </p>
        </div>
      </div>
    )
  }

  if (createdLink) {
    return (
      <div className="retro-card rounded-2xl p-8 border-2 border-[var(--success)]">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-[var(--success)] mb-2 uppercase">
            Link Created!
          </h3>
          <p className="text-xs text-gray-400">
            Share this link to receive {amount} USDC
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={createdLink.url} size={200} />
          </div>
        </div>

        {/* Link */}
        <div className="mb-6">
          <div className="bg-[#0f0f23] p-4 rounded-lg border border-[var(--success)]/30 break-all">
            <p className="font-mono text-xs text-[var(--success)]">
              {createdLink.url}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={copyLink}
            className="flex-1 bg-[var(--success)] text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-[var(--success)]/80 transition-colors"
          >
            📋 Copy Link
          </button>
          <button
            onClick={resetForm}
            className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-gray-600 transition-colors"
          >
            Create Another
          </button>
        </div>

        {/* Expires info */}
        {createdLink.expiresAt && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Expires in 24 hours
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="retro-card rounded-2xl p-8 border-2 border-[var(--accent)]">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4 animate-bounce">🔗</div>
        <h3 className="text-xl font-bold text-[var(--accent)] mb-2 uppercase">
          Create Payment Link
        </h3>
        <p className="text-xs text-gray-400">
          Generate a link to request USDC payment
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
          Amount (USDC)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10.00"
          step="0.01"
          min="0"
          className="w-full bg-[#0f0f23] border-2 border-[var(--accent)]/30 rounded-lg px-4 py-3 text-white font-mono focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      {/* Description Input */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Coffee ☕"
          maxLength={100}
          className="w-full bg-[#0f0f23] border-2 border-[var(--accent)]/30 rounded-lg px-4 py-3 text-white focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      {/* Create Button */}
      <button
        onClick={createLink}
        disabled={loading || !amount}
        className="arcade-button w-full bg-gradient-to-r from-[var(--accent)] to-[var(--arcade-blue)] text-white px-6 py-4 rounded-lg font-bold text-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Creating...' : '✨ START'}
      </button>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Links expire in 24 hours • Single use
        </p>
      </div>
    </div>
  )
}
