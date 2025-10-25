'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useAccount, useReadContract, useSignMessage } from 'wagmi'
import { keccak256, encodePacked } from 'viem'
import { basePassAddress, basePassABI } from '@/config/contract'
import { ErrorBoundary } from '@/components/error-boundary'

export function QRGenerator({ eventId }: { eventId: number }) {
  const { address } = useAccount()
  const [qrData, setQrData] = useState<string | null>(null)
  const [expirationHours, setExpirationHours] = useState(24)
  
  // Store the nonce and expiration when QR is generated (don't recalculate on render!)
  const [nonce, setNonce] = useState<string>('')
  const [expiration, setExpiration] = useState<number>(0)

  const { data: event } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getEvent',
    args: [BigInt(eventId)],
  })

  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess: (signature) => {
        // Create QR code data with all necessary information
        const qrPayload = {
          eventId,
          nonce,
          expiration: expiration.toString(),
          signature,
          chainId: 84532,
        }
        
        console.log('✅ QR Code Generated Successfully:', qrPayload)
        
        // Encode as base64 for URL
        const base64Data = btoa(JSON.stringify(qrPayload))
        
        // Create deep link with shorter URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const deepLink = `${baseUrl}/claim/${base64Data}`
        
        // Check if data is too long for QR code
        const maxLength = 2000 // QR codes have practical limits
        if (deepLink.length > maxLength) {
          console.warn('⚠️ QR data too long, using shortened version')
          // For very long data, we could implement a different approach
          // For now, let's try to compress the data
          const compressedPayload = {
            e: eventId,
            n: nonce,
            x: expiration.toString(),
            s: signature,
            c: 84532,
          }
          const compressedBase64 = btoa(JSON.stringify(compressedPayload))
          const compressedLink = `${baseUrl}/claim/${compressedBase64}`
          
          if (compressedLink.length <= maxLength) {
            console.log('🔍 Using compressed QR data, length:', compressedLink.length)
            setQrData(compressedLink)
          } else {
            console.error('❌ Even compressed data is too long for QR code')
            setQrData(deepLink.substring(0, maxLength))
          }
        } else {
          console.log('🔍 QR Data length:', deepLink.length)
          setQrData(deepLink)
        }
      },
    },
  })

  async function generateQR() {
    if (!event) return

    // Verify signer matches
    if (!address || address.toLowerCase() !== event.signer.toLowerCase()) {
      alert(`⚠️ Error: You must sign with the authorized signer wallet!\n\nExpected: ${event.signer}\nCurrent: ${address || 'Not connected'}`)
      return
    }

    // Generate NEW nonce and expiration when button is clicked
    const newNonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const newExpiration = Math.floor(Date.now() / 1000) + (expirationHours * 3600)
    
    // Save them to state
    setNonce(newNonce)
    setExpiration(newExpiration)

    // Create the message hash matching the smart contract
    // The contract hashes: keccak256(abi.encodePacked(eventId, nonce, expiration, chainId))
    const messageHash = keccak256(
      encodePacked(
        ['uint256', 'bytes32', 'uint256', 'uint256'],
        [BigInt(eventId), newNonce as `0x${string}`, BigInt(newExpiration), BigInt(84532)]
      )
    )

    console.log('🔐 Signing data:', {
      eventId,
      nonce: newNonce,
      expiration: newExpiration,
      expirationDate: new Date(newExpiration * 1000).toLocaleString(),
      chainId: 84532,
      messageHash,
      signer: address,
      expectedSigner: event.signer
    })

    // Sign the raw message hash
    // Wagmi will add the Ethereum Signed Message prefix automatically
    signMessage({ 
      message: { raw: messageHash }
    })
  }

  if (!event) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
      </div>
    )
  }

  const isAuthorizedSigner = address?.toLowerCase() === event.signer.toLowerCase()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">QR Code Generator</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
          Event ID: {eventId}
        </p>
      </div>

      {!isAuthorizedSigner && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-700 mb-4">
          <p className="text-red-800 dark:text-red-200 text-sm font-bold mb-2">
            ⛔ WRONG WALLET - Cannot Generate Valid QR Code
          </p>
          <p className="text-red-700 dark:text-red-300 text-xs mb-2">
            You must connect with the authorized signer wallet to create valid QR codes for this event.
          </p>
          <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs font-mono space-y-1">
            <p className="text-gray-600 dark:text-gray-400">Expected Signer:</p>
            <p className="text-red-600 dark:text-red-400 font-bold">{event.signer}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your Current Wallet:</p>
            <p className="text-gray-800 dark:text-gray-200">{address}</p>
          </div>
          <p className="text-red-700 dark:text-red-300 text-xs mt-2">
            💡 Switch to the correct wallet in your Base Wallet app
          </p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            QR Code Expiration (hours)
          </label>
          <input
            type="number"
            value={expirationHours}
            onChange={(e) => setExpirationHours(Number(e.target.value))}
            min="1"
            max="168"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            QR code will expire in {expirationHours} hours
          </p>
        </div>

        <button
          onClick={generateQR}
          disabled={!isAuthorizedSigner}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Generate QR Code
        </button>
      </div>

      {qrData && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
            <ErrorBoundary
              fallback={
                <div className="text-center p-4">
                  <p className="text-red-600">QR Code generation failed</p>
                  <p className="text-sm text-gray-500 mt-2">Data too long for QR code</p>
                </div>
              }
            >
              <QRCodeSVG 
                value={qrData} 
                size={256} 
                level="M" 
                includeMargin={true}
              />
            </ErrorBoundary>
          </div>
          
          {/* Expiration Info */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>✅ Valid until: {new Date(expiration * 1000).toLocaleString()}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              QR code ready to share!
            </p>
          </div>

          {/* Shareable Link */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Claim Link (Click to Copy)
            </label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrData)
                const btn = document.getElementById('copy-btn')
                if (btn) {
                  btn.textContent = '✓ Copied!'
                  setTimeout(() => {
                    btn.textContent = qrData
                  }, 2000)
                }
              }}
              id="copy-btn"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-mono text-xs text-left break-all"
            >
              {qrData}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Share this link or QR code with attendees to claim their stamps
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const canvas = document.createElement('canvas')
                const svg = document.querySelector('svg')
                if (!svg) return

                const svgData = new XMLSerializer().serializeToString(svg)
                const img = new Image()
                img.onload = () => {
                  canvas.width = img.width
                  canvas.height = img.height
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return
                  ctx.drawImage(img, 0, 0)
                  const a = document.createElement('a')
                  a.download = `basepass-event-${eventId}-qr.png`
                  a.href = canvas.toDataURL('image/png')
                  a.click()
                }
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Download QR
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Join ${event.name} on BasePass`,
                    text: 'Claim your event stamp!',
                    url: qrData,
                  }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(qrData)
                  alert('Link copied to clipboard!')
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Share Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

