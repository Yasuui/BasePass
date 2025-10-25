'use client'

import React from 'react'
import Link from 'next/link'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { readContract } from '@wagmi/core'
import { config } from '@/config/wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { WalletConnect } from '@/components/wallet-connect'
import { PassportCard } from '@/components/passport-card'
import { StampCollection } from '@/components/stamp-collection'
import { QRScannerModal } from '@/components/qr-scanner-modal'

export default function PassportPage() {
  const { address, isConnected } = useAccount()
  const [showScanner, setShowScanner] = React.useState(false)

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  })

  const { data: totalEvents } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalEvents',
  })

  const { data: totalPassports } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalPassports',
  })

  // Find the actual token ID for this user's passport
  // Since each user can only own ONE passport, we search through existing tokens
  const [userTokenId, setUserTokenId] = React.useState<bigint | undefined>(undefined)
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    async function findTokenId() {
      if (!address || !balance || balance === 0n || !totalPassports) {
        setUserTokenId(undefined)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      
      // Optimization: Search from most recent tokens first (reverse order)
      // Most recently minted passports are more likely to be queried
      for (let i = totalPassports; i >= 1n; i--) {
        try {
          const owner = await readContract(config, {
            address: basePassAddress,
            abi: basePassABI,
            functionName: 'ownerOf',
            args: [i],
          })
          if (owner.toLowerCase() === address.toLowerCase()) {
            setUserTokenId(i)
            setIsSearching(false)
            return
          }
        } catch (error) {
          // Token doesn't exist or error, continue
          continue
        }
      }
      
      setIsSearching(false)
    }

    findTokenId()
  }, [address, balance, totalPassports])

  // Watch for PassportMinted events to update balance
  useWatchContractEvent({
    address: basePassAddress,
    abi: basePassABI,
    eventName: 'PassportMinted',
    onLogs() {
      refetchBalance()
    },
  })

  const hasPassport = balance && balance > 0n
  const tokenId = userTokenId

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🎫 BasePass
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  My Passport
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link 
                href="/passport" 
                className="text-gray-900 dark:text-white font-semibold"
              >
                My Passport
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Events
              </Link>
              <WalletConnect />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {!isConnected ? (
            <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to view your passport
              </p>
              <WalletConnect />
            </div>
          ) : !hasPassport ? (
            <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                You don't have a passport yet
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mint Passport
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Passport Card */}
              <div className="max-w-2xl mx-auto">
                <PassportCard tokenId={tokenId} />
              </div>

              {/* Stats Section */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-2">🎫</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Passport ID</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isSearching ? (
                      <span className="text-lg flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Finding...
                      </span>
                    ) : tokenId ? (
                      `#${tokenId.toString()}`
                    ) : (
                      <span className="text-lg">Not found</span>
                    )}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-2">🎪</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalEvents?.toString() || '0'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stamps Collected</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalEvents && tokenId ? (
                      <StampCount tokenId={tokenId} totalEvents={totalEvents} />
                    ) : (
                      '0'
                    )}
                  </p>
                </div>
              </div>

              {/* Stamps Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  My Event Stamps 🎫
                </h3>
                <StampCollection passportId={tokenId} />
              </div>

              {/* Quick Scan Button */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Scan QR Code</h3>
                    <p className="text-sm text-purple-100">
                      Click to scan a stamp QR code at an event
                    </p>
                  </div>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="px-6 py-4 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-bold shadow-lg"
                  >
                    📸 Scan Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </div>
  )
}

function StampCount({ tokenId, totalEvents }: { tokenId: bigint; totalEvents: bigint }) {
  const { address } = useAccount()
  
  const { data: stampIds } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getPassportStamps',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })
  
  return <>{stampIds ? stampIds.length : 0}</>
}

