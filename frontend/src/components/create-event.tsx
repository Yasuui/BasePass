'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain, useReadContract } from 'wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { baseSepolia } from 'wagmi/chains'
import { NetworkSwitcher } from './network-switcher'

export function CreateEvent() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [signer, setSigner] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const isCorrectNetwork = chainId === baseSepolia.id

  // Check last event creation time for rate limiting
  const { data: lastEventTime } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'lastEventCreation',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address && isCorrectNetwork,
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  })

  const { data: eventCooldown } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'EVENT_COOLDOWN',
    chainId: baseSepolia.id,
  })

  // Calculate time remaining until next event can be created
  useEffect(() => {
    if (!lastEventTime || !eventCooldown || lastEventTime === 0n) {
      setTimeLeft(null)
      return
    }

    const updateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const canCreateAt = Number(lastEventTime) + Number(eventCooldown)
      const remaining = canCreateAt - now

      if (remaining <= 0) {
        setTimeLeft(null)
      } else {
        setTimeLeft(remaining)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [lastEventTime, eventCooldown])

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  })

  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!isConnected || !name || !description || !signer) return
    
    // If on wrong network, switch first
    if (!isCorrectNetwork) {
      setIsSwitchingNetwork(true)
      setSwitchError(null)
      
      try {
        await switchChainAsync({ chainId: baseSepolia.id })
        // Wait a bit for the switch to propagate
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err: any) {
        console.error('Failed to switch network:', err)
        setSwitchError(err.message || 'Failed to switch network. Please switch manually in your wallet.')
        setIsSwitchingNetwork(false)
        return
      }
      
      setIsSwitchingNetwork(false)
    }
    
    // Only proceed if we're on the correct network
    if (chainId !== baseSepolia.id) {
      setSwitchError('Please switch to Base Sepolia network manually in your wallet')
      return
    }
    
    writeContract({
      address: basePassAddress,
      abi: basePassABI,
      functionName: 'createEvent',
      args: [name, description, iconUrl || '', signer as `0x${string}`],
      chainId: baseSepolia.id,
    })
  }

  // Reset form on success
  if (isSuccess && !isPending && !isConfirming) {
    setTimeout(() => {
      setName('')
      setDescription('')
      setIconUrl('')
      setSigner('')
    }, 2000)
  }

  if (!isCorrectNetwork && isConnected) {
    return (
      <div className="space-y-4">
        <NetworkSwitcher />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-6 opacity-60">
          <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Switch to Base Sepolia testnet to continue
          </p>
        </div>
      </div>
    )
  }

  // Format time remaining
  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const canCreateEvent = timeLeft === null || timeLeft <= 0
  const isRateLimited = timeLeft !== null && timeLeft > 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
      
      {/* Rate Limit Warning */}
      {isRateLimited && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-yellow-900 dark:text-yellow-100 font-bold text-lg mb-1">
                ⏱️ Rate Limit Active
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-2">
                You can create another event in: <strong className="text-2xl font-mono">{formatTimeLeft(timeLeft)}</strong>
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                The smart contract enforces a 1-hour cooldown between event creations to prevent spam.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Event Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Base Builders Meetup"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Monthly meetup for Base builders"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Icon URL (optional)
          </label>
          <input
            type="text"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Signer Address *
          </label>
          <input
            type="text"
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Address authorized to sign QR codes (usually your wallet)
          </p>
          {address && (
            <button
              type="button"
              onClick={() => setSigner(address)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Use my address: {address.slice(0, 6)}...{address.slice(-4)}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming || !isConnected || isSwitchingNetwork || isRateLimited}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSwitchingNetwork 
            ? 'Switching Network...' 
            : isPending 
            ? 'Confirming...' 
            : isConfirming 
            ? 'Creating...'
            : isRateLimited
            ? `Rate Limited - Wait ${formatTimeLeft(timeLeft!)}`
            : !isCorrectNetwork
            ? 'Switch Network & Create Event'
            : 'Create Event'}
        </button>

        {isSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200">
              ✅ Event created successfully!
            </p>
            {hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-2 block"
              >
                View on BaseScan →
              </a>
            )}
          </div>
        )}

        {switchError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm font-semibold mb-2">
              ⚠️ Network Switch Failed
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm">
              {switchError}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm font-semibold mb-2">
              ❌ Transaction Failed
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm">
              {error.message.includes('Rate limit') 
                ? '⏱️ Rate limit: You must wait 1 hour between creating events. Please try again later.' 
                : error.message}
            </p>
            {error.message.includes('Rate limit') && timeLeft && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-2">
                Next event available in: <strong>{formatTimeLeft(timeLeft)}</strong>
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

