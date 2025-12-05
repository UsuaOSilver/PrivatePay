'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'

const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

interface PaymentLink {
  id: string
  creatorAddress: string
  recipientAddress?: string
  amount?: string
  description?: string
  createdAt: number
  expiresAt?: number
  claimCount: number
  maxClaims: number
  isActive: boolean
}

export default function PaymentPage() {
  const params = useParams()
  const linkId = params.id as string
  const { address, isConnected } = useAccount()
  const [link, setLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    fetchLink()
  }, [linkId])

  useEffect(() => {
    if (isConfirmed && hash) {
      recordClaim(hash)
    }
  }, [isConfirmed, hash])

  const fetchLink = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-links/${linkId}`)
      if (!response.ok) throw new Error('Link not found')

      const data = await response.json()
      setLink(data.link)
    } catch (error) {
      toast.error('Payment link not found')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const recordClaim = async (txHash: string) => {
    if (!link || !address) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-links/${linkId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payer_address: address,
          amount: link.amount || '0',
          tx_hash: txHash,
        })
      })
      setPaid(true)
      toast.success('Payment successful!')
    } catch (error) {
      console.error('Error recording claim:', error)
    }
  }

  const handlePay = () => {
    if (!link || !address) return

    const recipient = link.recipientAddress || link.creatorAddress
    const amount = link.amount || '1000000' // Default 1 USDC

    writeContract({
      address: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, BigInt(amount)]
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-bounce">⏳</div>
      </main>
    )
  }

  if (!link) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="retro-card rounded-2xl p-12 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-[var(--danger)] mb-2">Link Not Found</h2>
            <p className="text-gray-400">This payment link doesn't exist or has expired</p>
          </div>
        </div>
      </main>
    )
  }

  const amountUsdc = link.amount ? (parseInt(link.amount) / 1_000_000).toFixed(2) : '0.00'
  const isExpired = link.expiresAt && link.expiresAt < Date.now()
  const isMaxClaims = link.claimCount >= link.maxClaims

  if (paid || isConfirmed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="retro-card rounded-2xl p-12 max-w-md w-full border-2 border-[var(--success)]">
          <div className="text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-[var(--success)] mb-4 uppercase">
              Payment Complete!
            </h2>
            <p className="text-gray-400 mb-6">
              You sent {amountUsdc} USDC
            </p>
            {hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--arcade-blue)] hover:text-[var(--primary)] underline font-mono"
              >
                View on Basescan →
              </a>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--primary)] mb-2 uppercase">
            🪙 Coinflip
          </h1>
          <p className="text-sm text-gray-500">Payment Request</p>
        </div>

        {/* Payment Card */}
        <div className="retro-card rounded-2xl p-8 border-2 border-[var(--accent)]">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">💸</div>

            {/* Amount */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2 uppercase">Amount</p>
              <p className="text-5xl font-bold text-[var(--success)]">
                ${amountUsdc}
              </p>
              <p className="text-sm text-gray-500 mt-1">USDC</p>
            </div>

            {/* Description */}
            {link.description && (
              <div className="mb-6">
                <p className="text-lg text-[var(--foreground)] font-medium">
                  {link.description}
                </p>
              </div>
            )}

            {/* Recipient */}
            <div className="mb-6 p-4 bg-[#0f0f23] rounded-lg">
              <p className="text-xs text-gray-400 mb-1 uppercase">Recipient</p>
              <p className="font-mono text-xs text-gray-300">
                {(link.recipientAddress || link.creatorAddress).slice(0, 6)}...
                {(link.recipientAddress || link.creatorAddress).slice(-4)}
              </p>
            </div>
          </div>

          {/* Payment Button */}
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : (
            <>
              {(isExpired || isMaxClaims) ? (
                <div className="text-center">
                  <div className="p-4 bg-[var(--danger)]/10 rounded-lg border border-[var(--danger)]/30">
                    <p className="text-[var(--danger)] font-bold">
                      {isExpired ? '⏱️ Link Expired' : '🚫 Link Already Claimed'}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={isPending || isConfirming}
                  className="arcade-button w-full bg-gradient-to-r from-[var(--success)] to-[#00cc88] text-white px-6 py-4 rounded-lg font-bold text-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? '⏳ Confirm in Wallet...' :
                   isConfirming ? '⏳ Confirming...' :
                   `💸 Pay ${amountUsdc} USDC`}
                </button>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Powered by <span className="text-[var(--arcade-blue)]">Base</span> + <span className="text-[var(--success)]">Circle USDC</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
