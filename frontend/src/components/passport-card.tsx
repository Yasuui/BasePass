'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { basePassAddress, basePassABI } from '@/config/contract'
import { Avatar, Name, Badge, useName } from '@coinbase/onchainkit/identity'
import QRCode from 'qrcode'

interface PassportCardProps {
  tokenId?: bigint
  className?: string
}

export function PassportCard({ tokenId, className = '' }: PassportCardProps) {
  const { address } = useAccount()
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Check if user has a basename
  const { data: nameData } = useName({ address: address as `0x${string}` })
  const hasBasename = nameData && nameData.includes('.base.eth')

  // Get the token ID if not provided
  const { data: balance } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const hasPassport = balance && balance > 0n
  
  // Show token ID with fallback message
  const displayTokenId = tokenId
  const tokenIdDisplay = displayTokenId?.toString() || '...'

  // Generate QR code when address changes
  useEffect(() => {
    if (address) {
      QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeUrl)
        .catch(console.error)
    }
  }, [address])

  if (!address || !hasPassport) {
    return null
  }

  // Format address for display
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Passport Card */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        {/* Gradient Background - Base Blue Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-800/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        {/* Card Content */}
        <div className="relative p-8 min-h-[500px] flex flex-col justify-between">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg 
                    viewBox="0 0 111 111" 
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                  >
                    <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">BasePass</h3>
                  <p className="text-xs text-blue-100">Onchain Event Passport</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-100 mb-1">Token ID</p>
              <p className="text-lg font-bold text-white">#{tokenIdDisplay}</p>
            </div>
          </div>

          {/* Main Display - Basename Style with QR Code */}
          <div className="flex-1 flex items-center justify-center gap-8 my-8">
            {/* Left Side - QR Code */}
            <div className="flex-shrink-0">
              {qrCodeUrl && (
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <img 
                    src={qrCodeUrl} 
                    alt="Wallet QR Code"
                    className="w-32 h-32"
                  />
                  <p className="text-xs text-gray-600 text-center mt-2 font-medium">Scan to view</p>
                </div>
              )}
            </div>

            {/* Right Side - User Identity */}
            <div className="text-left">
              <div className="flex items-center gap-4 mb-4">
                {/* Large Avatar */}
                <Avatar 
                  address={address} 
                  className="w-20 h-20 border-4 border-white/30 shadow-xl rounded-full"
                />
                <div>
                  {/* Basename or ENS Name */}
                  <Name 
                    address={address}
                    chain={base}
                    className="text-4xl font-bold text-white block mb-1"
                  />
                  {/* Badge if user has a basename */}
                  <Badge address={address} />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-blue-100 font-mono bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                  {shortAddress}
                </p>
                <button
                  onClick={copyAddress}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
                  title="Copy full address"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-300 font-semibold animate-pulse">
                  ✓ Address copied!
                </p>
              )}
            </div>
          </div>

          {/* Footer - Verification Badge */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-full ${
              hasBasename 
                ? 'bg-green-500/20' 
                : 'bg-white/10'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                hasBasename 
                  ? 'bg-green-400 animate-pulse' 
                  : 'bg-gray-400'
              }`} />
              <span className="text-sm text-white font-medium">
                {hasBasename ? 'Basename Connected' : 'Verified Onchain'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-100">Network</p>
              <p className="text-sm font-semibold text-white">Base Sepolia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Shadow Effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-3xl blur-xl transform scale-95" />
    </div>
  )
}

