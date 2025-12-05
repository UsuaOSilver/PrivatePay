'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { SweepFunds } from './SweepFunds'
import { parseAbi } from 'viem'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)'
])

export function GeneratePayment() {
  const { address, isConnected } = useAccount()
  const [paymentAddress, setPaymentAddress] = useState<string>('')
  const [salt, setSalt] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  // Check USDC balance of burner address
  const { data: balance } = useReadContract({
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: paymentAddress ? [paymentAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!paymentAddress,
      refetchInterval: 5000, // Check every 5 seconds
    }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowShareMenu(false)
    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showShareMenu])

  if (!mounted) {
    return (
      <div className="retro-card rounded-2xl p-8">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">💰</div>
          <h3 className="text-xl font-bold text-[var(--primary)] mb-4 uppercase">
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

      // Save to localStorage
      saveWalletToHistory(data.wallet_address, data.salt, address)

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

  const saveWalletToHistory = (walletAddress: string, walletSalt: string, owner: string) => {
    const storageKey = `privatepay_wallets_${owner}`
    const existing = localStorage.getItem(storageKey)
    const wallets = existing ? JSON.parse(existing) : []

    // Check if wallet already exists
    if (!wallets.find((w: any) => w.address === walletAddress)) {
      wallets.push({
        address: walletAddress,
        salt: walletSalt,
        createdAt: Date.now()
      })
      localStorage.setItem(storageKey, JSON.stringify(wallets))
    }
  }

  if (!isConnected) {
    return (
      <div className="retro-card rounded-2xl p-8">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-pulse">🔒</div>
          <h3 className="text-xl font-bold text-[var(--accent)] uppercase">
            Connect Wallet
          </h3>
        </div>
      </div>
    )
  }

  if (!paymentAddress) {
    return (
      <div className="retro-card rounded-2xl p-8">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">💰</div>

          <button
            onClick={generateAddress}
            disabled={loading}
            className="arcade-button text-white text-sm font-bold px-10 py-4 rounded-xl uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-3 justify-center">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Loading...
              </span>
            ) : (
              'Press Start'
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-[var(--primary)]/30">
            <div className="flex justify-center gap-8 text-center">
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-xs font-bold text-[var(--accent)] uppercase">Instant</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-xs font-bold text-[var(--primary)] uppercase">Private</div>
              </div>
              <div>
                <div className="text-3xl mb-2">💸</div>
                <div className="text-xs font-bold text-[var(--success)] uppercase">Free</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="retro-card rounded-2xl p-6 relative overflow-hidden">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[var(--success)]/20 text-[var(--success)] px-4 py-2 rounded-lg text-xs font-bold mb-4 animate-pulse border border-[var(--success)]">
          ✨ READY
        </div>
        <h3 className="text-lg font-bold text-[var(--primary)] uppercase tracking-wide">
          Payment Address
        </h3>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-xl pixel-border">
          <QRCodeSVG
            value={paymentAddress}
            size={180}
            level="H"
            includeMargin={true}
            fgColor="#00ffff"
          />
        </div>
      </div>

      {/* Address Display */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 mb-6 border-2 border-[var(--primary)]/50 shadow-[0_0_20px_var(--primary-glow)]">
        <div className="font-mono text-xs text-[var(--primary)] break-all leading-relaxed text-center">
          {paymentAddress}
        </div>
      </div>

      {/* Share Button with Menu */}
      <div className="relative mb-6">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowShareMenu(!showShareMenu)
          }}
          className="arcade-button w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
        >
          📤 Share
        </button>

        {showShareMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full mt-2 w-full bg-[#1a1a3e] rounded-xl shadow-[0_0_30px_var(--primary-glow)] border-2 border-[var(--primary)] overflow-hidden z-10"
          >
            <button
              onClick={() => {
                copyAddress()
                setShowShareMenu(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-[var(--primary)]/20 transition-colors flex items-center gap-3 text-[var(--foreground)] font-bold text-xs uppercase"
            >
              <span className="text-xl">📋</span>
              <span>Copy</span>
            </button>
            <button
              onClick={() => {
                shareAddress()
                setShowShareMenu(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-[var(--primary)]/20 transition-colors flex items-center gap-3 text-[var(--foreground)] font-bold text-xs uppercase border-t border-[var(--primary)]/30"
            >
              <span className="text-xl">🚀</span>
              <span>Share</span>
            </button>
          </div>
        )}
      </div>

      {/* Sweep Funds Button */}
      <div className="mb-6">
        <SweepFunds burnerAddress={paymentAddress} salt={salt} />
      </div>

      {/* Balance Display */}
      <div className="mb-4 p-4 bg-[#1a1a3e] border-2 border-[var(--secondary)]/50 rounded-xl shadow-[0_0_20px_var(--secondary-glow)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--secondary)] font-bold uppercase tracking-widest">Balance</p>
            <p className="text-xl font-bold mt-1">
              {balance ? (
                <>
                  <span className="text-[var(--success)]">{(Number(balance) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  <span className="text-xs font-bold text-[var(--foreground)] ml-2">USDC</span>
                </>
              ) : (
                <span className="text-gray-500">0.00 USDC</span>
              )}
            </p>
          </div>
          <div className="text-4xl">
            {balance && balance > 0n ? '💰' : '⏳'}
          </div>
        </div>
        {balance && balance > 0n && (
          <div className="mt-3 pt-3 border-t border-[var(--accent)]/30">
            <p className="text-[var(--accent)] text-xs font-bold flex items-center gap-2 uppercase">
              ⚠️ Sweep before new address!
            </p>
          </div>
        )}
      </div>

      {/* Generate Another */}
      <button
        onClick={() => {
          const hasBalance = balance && balance > 0n
          const warningMessage = hasBalance
            ? '🚨 WARNING! This address has USDC! You will LOSE ACCESS to these funds if you continue. Please sweep first!\n\nAre you absolutely sure you want to generate a new address?'
            : '⚠️ Are you sure you want to generate a new address?'

          if (confirm(warningMessage)) {
            setPaymentAddress('')
            setSalt('')
          }
        }}
        className="w-full text-gray-400 font-bold py-3 rounded-xl hover:bg-[var(--primary)]/10 transition-all active:scale-95 text-xs uppercase border border-gray-600 hover:border-[var(--primary)]"
      >
        New Game
      </button>
    </div>
  )
}
