'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { useEffect, useState } from 'react'

export function NetworkSwitcher() {
  const { isConnected, connector } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending, error } = useSwitchChain()
  const [mounted, setMounted] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug: Log chain changes
  useEffect(() => {
    if (mounted && isConnected) {
      console.log('🔗 Current Chain ID:', chainId)
      console.log('🔗 Expected Chain ID:', baseSepolia.id)
      console.log('🔗 Is Correct Network:', chainId === baseSepolia.id)
      console.log('🔗 Connector:', connector?.name)
    }
  }, [chainId, mounted, isConnected, connector])

  if (!mounted || !isConnected) return null

  const isCorrectNetwork = chainId === baseSepolia.id
  const isCoinbaseWallet = connector?.name?.toLowerCase().includes('coinbase')
  
  if (isCorrectNetwork) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Base Sepolia ✓
      </div>
    )
  }

  const handleSwitch = async () => {
    setSwitchError(null)
    try {
      await switchChain({ chainId: baseSepolia.id })
    } catch (err: any) {
      console.error('Network switch error:', err)
      setSwitchError(err.message || 'Failed to switch network')
    }
  }

  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500">
      <div className="flex items-start gap-3">
        <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-900 dark:text-red-100 font-bold text-lg mb-1">
            ⚠️ Wrong Network!
          </h3>
          <p className="text-red-800 dark:text-red-200 text-sm mb-2">
            You're on <strong>{chainId === 8453 ? 'Base Mainnet' : `Chain ${chainId}`}</strong>. Need <strong>Base Sepolia (84532)</strong>.
          </p>
          {chainId === 8453 && (
            <p className="text-red-700 dark:text-red-300 text-xs font-bold mb-3 bg-red-200 dark:bg-red-800 p-2 rounded">
              🚨 DO NOT TRANSACT - You'll spend real ETH!
            </p>
          )}
          
          {isCoinbaseWallet ? (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded p-3 mb-3">
              <p className="text-yellow-900 dark:text-yellow-100 text-sm font-semibold mb-2">
                ⚠️ Coinbase Wallet Limitation
              </p>
              <p className="text-yellow-800 dark:text-yellow-200 text-xs mb-2">
                Coinbase Wallet doesn't support automatic network switching. Please:
              </p>
              <ol className="text-yellow-800 dark:text-yellow-200 text-xs list-decimal ml-4 space-y-1">
                <li>Disconnect your wallet</li>
                <li>Connect using <strong>MetaMask</strong> instead, or</li>
                <li>Manually switch to Base Sepolia in your wallet app</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleSwitch}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed mb-2"
            >
              {isPending ? 'Switching...' : 'Switch to Base Sepolia'}
            </button>
          )}

          {(switchError || error) && (
            <p className="text-red-700 dark:text-red-300 text-xs mt-2">
              Error: {switchError || error?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

