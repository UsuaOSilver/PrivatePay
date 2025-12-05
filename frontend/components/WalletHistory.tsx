'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { parseAbi, formatUnits } from 'viem'
import { SweepFunds } from './SweepFunds'
import { AutoSweepToggle } from './AutoSweepToggle'
import { SweepHistory } from './SweepHistory'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)'
])

interface BurnerWallet {
  address: string
  salt: string
  createdAt: number
}

export function WalletHistory({ onSelectWallet }: { onSelectWallet: (address: string, salt: string) => void }) {
  const { address: userAddress } = useAccount()
  const [wallets, setWallets] = useState<BurnerWallet[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (userAddress) {
      // Load wallets from localStorage for this user
      const stored = localStorage.getItem(`privatepay_wallets_${userAddress}`)
      if (stored) {
        setWallets(JSON.parse(stored))
      }
    }
  }, [userAddress])

  if (!userAddress || wallets.length === 0) {
    return null
  }

  return (
    <div className="retro-card rounded-2xl p-6 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">📚</div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[var(--primary)] uppercase">Your Wallets</h3>
            <p className="text-xs text-gray-400">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="transition-transform duration-300" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10L12 15L17 10H7Z" fill="currentColor" className="text-[var(--accent)]"/>
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-6 space-y-3">
          {wallets.map((wallet, index) => (
            <WalletCard
              key={wallet.address}
              wallet={wallet}
              index={wallets.length - index}
              onSelect={() => onSelectWallet(wallet.address, wallet.salt)}
              onDelete={() => {
                const updated = wallets.filter(w => w.address !== wallet.address)
                setWallets(updated)
                localStorage.setItem(`privatepay_wallets_${userAddress}`, JSON.stringify(updated))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WalletCard({
  wallet,
  index,
  onSelect,
  onDelete
}: {
  wallet: BurnerWallet
  index: number
  onSelect: () => void
  onDelete: () => void
}) {
  const { data: balance } = useReadContract({
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [wallet.address as `0x${string}`],
    query: {
      refetchInterval: 10000, // Check every 10 seconds
    }
  })

  const hasBalance = balance && balance > 0n
  const balanceFormatted = balance ? formatUnits(balance, 6) : '0'

  return (
    <div className={`border-2 rounded-xl p-4 transition-all ${hasBalance ? 'border-[var(--success)]/50 bg-[var(--success)]/5' : 'border-gray-700 bg-[#1a1a3e]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400">#{index}</span>
            {hasBalance && <span className="text-xs bg-[var(--success)]/20 text-[var(--success)] px-2 py-0.5 rounded font-bold uppercase border border-[var(--success)]/30">Funded</span>}
          </div>
          <p className="font-mono text-xs text-gray-300 break-all">
            {wallet.address}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(wallet.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 p-3 bg-[#0f0f23] rounded-lg border border-gray-700">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase">Balance</p>
          <p className="text-lg font-bold">
            <span className={hasBalance ? 'text-[var(--success)]' : 'text-gray-500'}>
              {parseFloat(balanceFormatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
            <span className="text-xs text-gray-500 ml-1">USDC</span>
          </p>
        </div>
        <div className="text-2xl">
          {hasBalance ? '💰' : '⏳'}
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={onSelect}
          className="flex-1 bg-[var(--arcade-blue)] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[var(--arcade-blue)]/80 transition-colors uppercase"
        >
          View
        </button>
        {hasBalance && (
          <div className="flex-1">
            <SweepFunds burnerAddress={wallet.address} salt={wallet.salt} />
          </div>
        )}
        {!hasBalance && (
          <button
            onClick={() => {
              if (confirm('Delete this empty burner wallet?')) {
                onDelete()
              }
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors border border-[var(--danger)]"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Auto-sweep toggle */}
      <div className="mb-3">
        <AutoSweepToggle
          walletAddress={wallet.address}
          salt={wallet.salt}
          initialEnabled={false}
        />
      </div>

      {/* Sweep history */}
      <SweepHistory walletAddress={wallet.address} />
    </div>
  )
}
