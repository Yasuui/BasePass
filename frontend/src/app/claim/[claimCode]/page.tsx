'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useSwitchChain } from 'wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { baseSepolia } from 'wagmi/chains'
import { WalletConnect } from '@/components/wallet-connect'
import { NetworkSwitcher } from '@/components/network-switcher'
import { readContract } from '@wagmi/core'
import { config } from '@/config/wagmi'

interface ClaimData {
  eventId: number
  nonce: string
  expiration: string
  signature: string
  chainId: number
}

interface CompressedClaimData {
  e: number  // eventId
  n: string  // nonce
  x: string  // expiration
  s: string  // signature
  c: number  // chainId
}

export default function ClaimPage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [userTokenId, setUserTokenId] = useState<bigint | undefined>(undefined)

  const isCorrectNetwork = chainId === baseSepolia.id

  // Get user's passport balance
  const { data: balance } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
  })

  const { data: totalPassports } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalPassports',
    chainId: baseSepolia.id,
  })

  const hasPassport = balance && balance > 0n

  // Find user's token ID
  useEffect(() => {
    async function findTokenId() {
      if (!address || !balance || balance === 0n || !totalPassports) {
        setUserTokenId(undefined)
        return
      }

      for (let i = 1n; i <= totalPassports; i++) {
        try {
          const owner = await readContract(config, {
            address: basePassAddress,
            abi: basePassABI,
            functionName: 'ownerOf',
            args: [i],
          })
          if (owner.toLowerCase() === address.toLowerCase()) {
            setUserTokenId(i)
            return
          }
        } catch (error) {
          continue
        }
      }
    }

    findTokenId()
  }, [address, balance, totalPassports])

  // Decode claim code on mount
  useEffect(() => {
    const claimCode = params.claimCode as string
    if (!claimCode) return

    console.log('🔍 Parsing claim code:', claimCode.substring(0, 50) + '...')
    console.log('🔍 Claim code length:', claimCode.length)

    try {
      // Clean and validate base64 string
      const cleanClaimCode = claimCode
        .replace(/[^A-Za-z0-9+/=]/g, '') // Remove invalid base64 characters
        .replace(/\s/g, '') // Remove whitespace
      
      console.log('🔍 Original claim code length:', claimCode.length)
      console.log('🔍 Cleaned claim code length:', cleanClaimCode.length)
      console.log('🔍 First 50 chars:', cleanClaimCode.substring(0, 50))
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanClaimCode)) {
        throw new Error('Invalid base64 format in claim code')
      }
      
      // Decode base64 with error handling and padding fix
      let decoded: string
      try {
        // Ensure proper base64 padding
        let paddedCode = cleanClaimCode
        while (paddedCode.length % 4 !== 0) {
          paddedCode += '='
        }
        
        // Try to decode with padding
        decoded = atob(paddedCode)
      } catch (base64Error) {
        console.error('❌ Base64 decode error:', base64Error)
        
        // Try alternative decoding approach
        try {
          // Remove any trailing padding and re-add correctly
          const trimmedCode = cleanClaimCode.replace(/=+$/, '')
          const correctPadding = '='.repeat((4 - (trimmedCode.length % 4)) % 4)
          const finalCode = trimmedCode + correctPadding
          
          console.log('🔧 Trying with corrected padding...')
          decoded = atob(finalCode)
        } catch (secondError) {
          console.error('❌ Second decode attempt failed:', secondError)
          throw new Error('Failed to decode base64 claim code - data may be corrupted')
        }
      }
      
      console.log('🔍 Decoded data:', decoded.substring(0, 100) + '...')
      console.log('🔍 Decoded data length:', decoded.length)
      
      // Clean the decoded string before JSON parsing
      const cleanedDecoded = decoded
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .trim() // Remove leading/trailing whitespace
      
      console.log('🔍 Cleaned decoded data:', cleanedDecoded.substring(0, 100) + '...')
      console.log('🔍 Cleaned length:', cleanedDecoded.length)
      
      // Try to find JSON object boundaries
      const jsonStart = cleanedDecoded.indexOf('{')
      const jsonEnd = cleanedDecoded.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        throw new Error('No valid JSON object found in decoded data')
      }
      
      const jsonString = cleanedDecoded.substring(jsonStart, jsonEnd + 1)
      console.log('🔍 Extracted JSON:', jsonString.substring(0, 100) + '...')
      
      const parsedData = JSON.parse(jsonString)
      console.log('🔍 Parsed claim data:', parsedData)

      // Handle both full and compressed formats
      let data: ClaimData
      
      if (parsedData.eventId && parsedData.nonce && parsedData.expiration && parsedData.signature) {
        // Full format
        data = parsedData as ClaimData
        console.log('🔍 Using full format')
      } else if (parsedData.e && parsedData.n && parsedData.x && parsedData.s) {
        // Compressed format
        data = {
          eventId: parsedData.e,
          nonce: parsedData.n,
          expiration: parsedData.x,
          signature: parsedData.s,
          chainId: parsedData.c || 84532
        } as ClaimData
        console.log('🔍 Using compressed format')
      } else {
        throw new Error('Invalid claim data format')
      }

      // Validate required fields
      if (!data.eventId || !data.nonce || !data.expiration || !data.signature) {
        console.error('❌ Missing required fields:', {
          eventId: !!data.eventId,
          nonce: !!data.nonce,
          expiration: !!data.expiration,
          signature: !!data.signature
        })
        throw new Error('Missing required fields in claim data')
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      const expirationTime = Number(data.expiration)
      console.log('🔍 Expiration check:', {
        now,
        expiration: expirationTime,
        expired: expirationTime < now
      })
      
      if (expirationTime < now) {
        throw new Error('This claim link has expired')
      }

      setClaimData(data)
      console.log('✅ Claim data parsed successfully')
    } catch (err) {
      console.error('❌ Parse error:', err)
      
      // Try to provide more helpful error messages
      let errorMessage = 'Invalid claim link'
      if (err instanceof Error) {
        if (err.message.includes('base64')) {
          errorMessage = 'Invalid QR code format. Please scan the QR code again or check the link.'
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Corrupted claim data. Please try generating a new QR code.'
        } else if (err.message.includes('expired')) {
          errorMessage = 'This claim link has expired. Please request a new one.'
        } else {
          errorMessage = err.message
        }
      }
      
      setParseError(errorMessage)
    }
  }, [params.claimCode])

  // Get event details
  const { data: event } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getEvent',
    args: claimData ? [BigInt(claimData.eventId)] : undefined,
    query: {
      enabled: !!claimData,
    },
  })

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  })

  async function handleClaim() {
    if (!claimData || !userTokenId) return
    
    if (!isCorrectNetwork) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id })
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        console.error('Failed to switch network:', err)
        return
      }
    }

    // Debug logging
    console.log('📝 Claiming stamp with data:', {
      tokenId: userTokenId.toString(),
      eventId: claimData.eventId,
      nonce: claimData.nonce,
      expiration: claimData.expiration,
      signature: claimData.signature,
      claimer: address,
    })

    writeContract({
      address: basePassAddress,
      abi: basePassABI,
      functionName: 'claimStamp',
      chainId: baseSepolia.id,
      args: [
        userTokenId,
        BigInt(claimData.eventId),
        claimData.nonce as `0x${string}`,
        BigInt(claimData.expiration),
        claimData.signature as `0x${string}`,
      ],
    })
  }

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
                  Claim Event Stamp
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/passport" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                My Passport
              </Link>
              <WalletConnect />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {parseError ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-red-300 dark:border-red-700">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Invalid Claim Link
                </h2>
                <p className="text-red-600 dark:text-red-400 mb-6">
                  {parseError}
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : !claimData ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading claim data...
                </p>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Connect your wallet to claim this event stamp
                </p>
                <WalletConnect />
              </div>
            </div>
          ) : !hasPassport ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🎫</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Passport Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You need to mint a BasePass passport before claiming stamps
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-700 transition-colors font-medium"
                >
                  Mint Passport
                </Link>
              </div>
            </div>
          ) : !isCorrectNetwork ? (
            <div className="space-y-6">
              <NetworkSwitcher />
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 opacity-60">
                <h2 className="text-2xl font-bold mb-4">Claim Event Stamp</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Switch to Base Sepolia testnet to continue
                </p>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-4 border-green-500">
              <div className="text-center">
                {/* Success Animation */}
                <div className="relative inline-block mb-6">
                  <div className="text-8xl animate-bounce">🎉</div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Success Message */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border-2 border-green-300 dark:border-green-700">
                  <h2 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-3">
                    ✅ Stamp Received!
                  </h2>
                  <p className="text-lg text-green-800 dark:text-green-200 mb-2">
                    Transaction confirmed on Base blockchain
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    The event stamp has been permanently added to your passport
                  </p>
                </div>

                {/* Event Info */}
                {event && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">You attended:</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{event.name}</p>
                  </div>
                )}

                {/* Transaction Link */}
                {hash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Transaction on BaseScan
                  </a>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Link
                    href="/passport"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
                  >
                    🎫 View My Passport
                  </Link>
                  <Link
                    href="/"
                    className="px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎪</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Claim Event Stamp
                </h2>
              </div>

              {event && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-6 border-2 border-blue-300 dark:border-blue-700">
                  <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Event ID: #{claimData.eventId}</span>
                    <span>•</span>
                    <span>Expires: {new Date(Number(claimData.expiration) * 1000).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6 border border-yellow-300 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Warning:</strong> Always verify you're claiming from the correct event organizer. Check the event details above match what you expect.
                </p>
              </div>

              <button
                onClick={handleClaim}
                disabled={isPending || isConfirming || !userTokenId}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Claiming...' : 'Claim Stamp Now'}
              </button>

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {error.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

