'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { readContract } from '@wagmi/core'
import { config } from '@/config/wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { Name, Avatar } from '@coinbase/onchainkit/identity'
import Link from 'next/link'
import QRCode from 'qrcode'

export function PassportViewer() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [userTokenId, setUserTokenId] = useState<bigint | undefined>(undefined)

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address,
      refetchInterval: 3000, // Refetch every 3 seconds to catch new mints
    }
  })

  const { data: totalPassports, refetch: refetchTotalPassports } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalPassports',
    chainId: baseSepolia.id,
    query: {
      refetchInterval: 3000,
    }
  })

  // Find user's token ID
  useEffect(() => {
    async function findTokenId() {
      if (!address || !balance || balance === 0n || !totalPassports) {
        setUserTokenId(undefined)
        return
      }

      // Search from most recent tokens first (reverse order)
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
            return
          }
        } catch (error) {
          continue
        }
      }
    }

    findTokenId()
  }, [address, balance, totalPassports])

  // Generate QR code when address changes
  useEffect(() => {
    if (address) {
      // Limit address length for QR code to prevent "Data too long" error
      const qrData = address.length > 100 ? address.substring(0, 100) : address
      
      QRCode.toDataURL(qrData, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeUrl)
        .catch((error) => {
          console.error('QR Code generation error:', error)
          // Fallback to a simple text representation
          setQrCodeUrl('')
        })
    }
  }, [address])

  // Watch for PassportMinted events and refetch immediately
  useWatchContractEvent({
    address: basePassAddress,
    abi: basePassABI,
    eventName: 'PassportMinted',
    chainId: baseSepolia.id,
    onLogs() {
      refetchBalance()
      refetchTotalPassports()
    },
  })

  if (!isConnected) {
    return null
  }

  const hasPassport = balance && balance > 0n
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4">My Passport Status</h2>
      
      <div className="space-y-4">
        {hasPassport ? (
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-500">
            <div className="flex items-start gap-6">
              {/* QR Code */}
              <div className="flex-shrink-0">
                {qrCodeUrl && (
                  <div className="bg-white p-2 rounded-lg shadow-md">
                    <img 
                      src={qrCodeUrl} 
                      alt="Wallet QR Code"
                      className="w-24 h-24"
                    />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <p className="text-green-800 dark:text-green-200 font-bold text-xl flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  BasePass Passport Active
                </p>
                
                {/* Identity (Basename / ENS / Address) */}
                <div className="mb-3">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Identity</p>
                  <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                    {address && (
                      <Name 
                        address={address}
                        chain={base}
                      >
                        <span className="font-mono text-sm">{shortAddress}</span>
                      </Name>
                    )}
                  </div>
                </div>

                {/* Wallet Address with Copy */}
                <div className="mb-3">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded border border-green-300 dark:border-green-700">
                      {shortAddress}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      title="Copy full address"
                    >
                      {copied ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-1">
                      ✓ Address copied to clipboard!
                    </p>
                  )}
                </div>

                {/* Token ID */}
                <div className="mb-4">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Passport ID</p>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    {userTokenId ? `#${userTokenId.toString()}` : '...'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    View full passport for details
                  </p>
                </div>

                {/* Action Button */}
                <Link
                  href="/passport"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Full Passport
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              You don't have a passport yet. Mint one to get started!
            </p>
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between pt-2">
          <p>Total Passports Minted: <span className="font-semibold text-gray-900 dark:text-white">{totalPassports?.toString() || '0'}</span></p>
        </div>
      </div>
    </div>
  )
}

