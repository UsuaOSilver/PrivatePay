'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'
import { parseAbi } from 'viem'

const DEPLOYER_ABI = parseAbi([
  'function deployAndSweepERC20(bytes32 salt, address token, address recipient) returns (address)'
])

export function SweepFunds({ burnerAddress, salt }: { burnerAddress: string, salt: string }) {
  const { address } = useAccount()
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const sweep = async () => {
    if (!address) return

    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS as `0x${string}`,
        abi: DEPLOYER_ABI,
        functionName: 'deployAndSweepERC20',
        args: [
          salt as `0x${string}`,
          process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
          address
        ]
      })
      toast.success('Sweep initiated!')
    } catch (error) {
      toast.error('Sweep failed')
      console.error(error)
    }
  }

  return (
    <button
      onClick={sweep}
      disabled={isConfirming}
      className="arcade-button w-full bg-gradient-to-r from-[var(--arcade-purple)] to-[var(--arcade-pink)] text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConfirming ? '🔄 Sweeping...' : '💸 Sweep USDC'}
    </button>
  )
}
