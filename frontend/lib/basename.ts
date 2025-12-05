import { normalize } from 'viem/ens'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'

// Basename resolver
const BASENAME_L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' // Base mainnet
const BASENAME_SEPOLIA_RESOLVER_ADDRESS = '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA' // Base Sepolia

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

export async function resolveBasename(address: string): Promise<string | null> {
  try {
    // Try to get the primary Basename for this address
    const basename = await publicClient.getEnsName({
      address: address as `0x${string}`,
    })

    return basename
  } catch (error) {
    console.error('Error resolving basename:', error)
    return null
  }
}

export async function resolveAddress(name: string): Promise<string | null> {
  try {
    // Normalize the ENS name
    const normalized = normalize(name)

    // Resolve basename to address
    const address = await publicClient.getEnsAddress({
      name: normalized,
    })

    return address
  } catch (error) {
    console.error('Error resolving address:', error)
    return null
  }
}

// Format address with basename if available
export function formatAddressWithBasename(address: string, basename?: string | null): string {
  if (basename) {
    return basename
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Check if a string is a valid basename
export function isBasename(str: string): boolean {
  return str.endsWith('.base.eth') || str.endsWith('.basetest.eth')
}

// Farcaster username cache (mock for now)
const farcasterCache: Record<string, string> = {
  // Mock data - in production, fetch from Farcaster API
  '0x742d35cc6634c0532925a3b844bc9e7595f0beb': 'alice',
  '0x853d955acef822db058eb8505911ed77f175b99e': 'bob'
}

export function getFarcasterUsername(address: string): string | null {
  const normalized = address.toLowerCase()
  return farcasterCache[normalized] || null
}

// Build Farcaster cast intent URL
export function buildFarcasterCastIntent(text: string, embeds?: string[]): string {
  const params = new URLSearchParams()
  params.append('text', text)
  if (embeds && embeds.length > 0) {
    embeds.forEach(embed => params.append('embeds[]', embed))
  }
  return `https://warpcast.com/~/compose?${params.toString()}`
}
