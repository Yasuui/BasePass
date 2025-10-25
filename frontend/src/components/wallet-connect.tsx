'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { base } from 'wagmi/chains'
import { Name, Avatar } from '@coinbase/onchainkit/identity'

export function WalletConnect() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowConnectors(!showConnectors)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Connect Wallet
        </button>
        
        {showConnectors && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50">
            <div className="mb-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 font-semibold">
              Choose Wallet
            </div>
            {connectors.map((conn) => (
              <button
                key={conn.uid}
                onClick={() => {
                  connect({ connector: conn })
                  setShowConnectors(false)
                }}
                disabled={isPending}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-3 text-sm"
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {conn.name === 'MetaMask' && '🦊'}
                  {conn.name.includes('Coinbase') && '🔵'}
                  {!conn.name.includes('Coinbase') && !conn.name.includes('MetaMask') && '💼'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{conn.name}</div>
                  {conn.name.includes('Coinbase') && (
                    <div className="text-xs text-gray-500">Limited network switching</div>
                  )}
                  {conn.name === 'MetaMask' && (
                    <div className="text-xs text-green-600">✓ Recommended</div>
                  )}
                </div>
              </button>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Tip: Use MetaMask for easy network switching
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {address && (
          <>
            <Avatar address={address} className="w-6 h-6" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              <Name address={address} chain={base}>
                <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </Name>
            </div>
          </>
        )}
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50">
          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              {address && <Avatar address={address} className="w-8 h-8" />}
              <div className="flex-1">
                {address && (
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    <Name address={address} chain={base}>
                      <span className="font-mono text-xs">{address.slice(0, 10)}...</span>
                    </Name>
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Connected with {connector?.name}
                </div>
              </div>
            </div>
            {address && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address)
                }}
                className="w-full px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                📋 Copy Address
              </button>
            )}
          </div>
          
          <button
            onClick={() => {
              disconnect()
              setShowDropdown(false)
            }}
            className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors font-medium"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

