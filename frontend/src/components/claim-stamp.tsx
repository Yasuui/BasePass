'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useSwitchChain, useConfig } from 'wagmi'
import { readContract } from '@wagmi/core'
import { basePassAddress, basePassABI } from '@/config/contract'
import { baseSepolia } from 'wagmi/chains'
import { NetworkSwitcher } from './network-switcher'

interface QRData {
  eventId: number
  nonce: string
  expiration: string
  signature: string
  chainId: number
}

export function ClaimStamp() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const config = useConfig()
  const [qrInput, setQrInput] = useState('')
  const [parsedData, setParsedData] = useState<QRData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  
  const isCorrectNetwork = chainId === baseSepolia.id

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

  // Find the user's tokenId by checking ownership
  // Since each user can only have one passport, we search for it
  const [tokenId, setTokenId] = useState<bigint | undefined>()
  const [findingToken, setFindingToken] = useState(false)

  // Query to find user's token when they have a passport
  useEffect(() => {
    async function findUserToken() {
      if (!address || !totalPassports || !hasPassport) return
      if (tokenId) return // Already found, don't search again
      if (findingToken) return // Already searching
      
      setFindingToken(true)
      console.log(`🔍 Searching for tokenId for ${address} among ${totalPassports} passports...`)
      
      // Search through all minted passports to find the user's token
      for (let i = 1n; i <= totalPassports; i++) {
        try {
          const owner = await readContract(config, {
            address: basePassAddress,
            abi: basePassABI,
            functionName: 'ownerOf',
            args: [i],
            chainId: baseSepolia.id,
          })
          
          if (owner?.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ Found tokenId: ${i} for address ${address}`)
            setTokenId(i)
            setFindingToken(false)
            return
          }
        } catch (error) {
          // Token doesn't exist or error, continue searching
          continue
        }
      }
      
      console.log(`❌ No tokenId found for ${address}`)
      setFindingToken(false)
    }
    
    findUserToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, totalPassports, hasPassport])

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  })

  function handleParseQR() {
    setParseError(null)
    setParsedData(null)

    try {
      const data = JSON.parse(qrInput) as QRData
      
      // Validate required fields
      if (!data.eventId || !data.nonce || !data.expiration || !data.signature) {
        throw new Error('Missing required fields in QR data')
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (Number(data.expiration) < now) {
        throw new Error('QR code has expired')
      }

      setParsedData(data)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid QR data')
    }
  }

  async function handleClaim() {
    if (!parsedData || !tokenId) return
    if (!isCorrectNetwork) await switchChainAsync({ chainId: baseSepolia.id })

    writeContract({
      address: basePassAddress,
      abi: basePassABI,
      functionName: 'claimStamp',
      chainId: baseSepolia.id,
      args: [
        tokenId,
        BigInt(parsedData.eventId),
        parsedData.nonce as `0x${string}`,
        BigInt(parsedData.expiration),
        parsedData.signature as `0x${string}`,
      ],
    })
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-800 dark:text-yellow-200">
          Please connect your wallet to claim stamps
        </p>
      </div>
    )
  }

  if (!hasPassport) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-800 dark:text-yellow-200">
          You need to mint a passport first before claiming stamps
        </p>
      </div>
    )
  }

  if (findingToken || !tokenId) {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-blue-800 dark:text-blue-200">
          🔍 Finding your passport token ID... Please wait.
        </p>
        {findingToken && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            Searching through {totalPassports?.toString()} passports...
          </p>
        )}
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="space-y-4">
        <NetworkSwitcher />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-6 opacity-60">
          <h2 className="text-2xl font-bold mb-4">Claim Event Stamp</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Switch to Base Sepolia testnet to continue
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Claim Event Stamp</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Paste QR Code Data
          </label>
          <textarea
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder='{"eventId":1,"nonce":"0x...","expiration":"...","signature":"0x...","chainId":84532}'
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-xs"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Scan QR code and paste the data here, or enter manually for testing
          </p>
        </div>

        <button
          onClick={handleParseQR}
          disabled={!qrInput}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Parse QR Data
        </button>

        {parseError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {parseError}
            </p>
          </div>
        )}

        {parsedData && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✓ QR Data Valid
            </p>
            <div className="text-sm space-y-1">
              <p><strong>Event ID:</strong> {parsedData.eventId}</p>
              <p><strong>Expires:</strong> {new Date(Number(parsedData.expiration) * 1000).toLocaleString()}</p>
              <p><strong>Chain ID:</strong> {parsedData.chainId}</p>
            </div>

            <button
              onClick={handleClaim}
              disabled={isPending || isConfirming || !isCorrectNetwork}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Claiming...' : 'Claim Stamp'}
            </button>
          </div>
        )}

        {isSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200">
              🎉 Stamp claimed successfully!
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

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

