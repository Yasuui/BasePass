'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useWatchContractEvent, useChainId, useSwitchChain } from 'wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { baseSepolia } from 'wagmi/chains'
import Link from 'next/link'
import { NetworkSwitcher } from './network-switcher'

export function MintPassport() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract()
  const [showSuccess, setShowSuccess] = useState(false)
  const { switchChainAsync } = useSwitchChain()
  
  const isCorrectNetwork = chainId === baseSepolia.id
  
  const { isLoading: isConfirming, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  })

  // Check if user already has a passport
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address,
    }
  })

  const hasPassport = balance && balance > 0n

  // Watch for PassportMinted events for this user
  useWatchContractEvent({
    address: basePassAddress,
    abi: basePassABI,
    eventName: 'PassportMinted',
    chainId: baseSepolia.id,
    onLogs(logs) {
      // Check if the event is for the current user
      const userMinted = logs.some(log => {
        const eventArgs = log.args as { owner?: string }
        return eventArgs.owner?.toLowerCase() === address?.toLowerCase()
      })
      
      if (userMinted) {
        refetchBalance()
        setShowSuccess(true)
      }
    },
  })

  // Refetch balance after successful mint - multiple attempts to catch the update
  useEffect(() => {
    if (isTransactionSuccess) {
      // Immediate refetch
      refetchBalance()
      
      // Set a flag to show we're waiting for balance update
      setShowSuccess(true)
      
      // Refetch after 1 second
      const timer1 = setTimeout(() => {
        refetchBalance()
      }, 1000)
      
      // Refetch after 3 seconds
      const timer2 = setTimeout(() => {
        refetchBalance()
      }, 3000)
      
      // Refetch after 5 seconds
      const timer3 = setTimeout(() => {
        refetchBalance()
      }, 5000)
      
      // Refetch after 8 seconds (final attempt)
      const timer4 = setTimeout(() => {
        refetchBalance()
      }, 8000)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [isTransactionSuccess, refetchBalance])

  // Reset success state when user changes
  useEffect(() => {
    setShowSuccess(false)
  }, [address])

  async function handleMint() {
    if (!isConnected || hasPassport) return
    if (!isCorrectNetwork) await switchChainAsync({ chainId: baseSepolia.id })

    writeContract({
      address: basePassAddress,
      abi: basePassABI,
      functionName: 'mintPassport',
      chainId: baseSepolia.id,
    })
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-800 dark:text-yellow-200">
          Please connect your wallet to mint a passport
        </p>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="space-y-4">
        <NetworkSwitcher />
        <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60">
          <h2 className="text-2xl font-bold mb-4">Mint Your BasePass Passport</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Switch to Base Sepolia testnet to continue
          </p>
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium"
          >
            Switch Network to Continue
          </button>
        </div>
      </div>
    )
  }

  if (hasPassport) {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-2xl font-bold mb-4 text-blue-900 dark:text-blue-100">You Already Have a Passport!</h2>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          You can only mint one passport per wallet. View your passport to see your stamps and claim new ones.
        </p>
        <Link
          href="/passport"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View My Passport
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Mint Your BasePass Passport</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Get your onchain passport NFT to start collecting event stamps!
      </p>
      
      <button
        onClick={handleMint}
        disabled={isPending || isConfirming || showSuccess}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirming in Wallet...' : isConfirming ? 'Minting on Blockchain...' : 'Mint Passport'}
      </button>

      {showSuccess && !hasPassport && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200 font-semibold flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing your mint...
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            Your passport is being created. This may take a few moments...
          </p>
          {hash && (
            <a
              href={`https://sepolia.basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
            >
              View transaction on BaseScan →
            </a>
          )}
        </div>
      )}

      {showSuccess && hasPassport && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500 shadow-lg">
          <p className="text-green-800 dark:text-green-200 font-bold text-lg flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Passport Minted Successfully!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            🎉 Congratulations! Your BasePass passport has been created and is now ready to use!
          </p>
          {hash && (
            <a
              href={`https://sepolia.basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
            >
              View transaction on BaseScan →
            </a>
          )}
          <Link
            href="/passport"
            className="inline-block mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow-md"
          >
            View My Passport
          </Link>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200 text-sm font-semibold">
            ❌ Error: {error.message}
          </p>
          <button
            onClick={() => {
              reset()
              setShowSuccess(false)
            }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

