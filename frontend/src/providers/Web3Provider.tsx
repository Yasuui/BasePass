'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/config/wagmi'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import { ReactNode, useState, useEffect } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Get API key and sanitize it properly
    const rawApiKey = process.env.NEXT_PUBLIC_CDP_API_KEY || ''
    
    // More robust sanitization for UUID-style API keys
    const sanitizedApiKey = rawApiKey
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes if wrapped
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/\n/g, '') // Remove newlines
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/[^\w\-]/g, '') // Remove any non-alphanumeric chars except hyphens/underscores
    
    // Validate API key format (UUID format with hyphens is expected)
    const isValidApiKey = sanitizedApiKey.length > 0 && 
                          sanitizedApiKey.length <= 100 && 
                          /^[a-zA-Z0-9_-]+$/.test(sanitizedApiKey) &&
                          sanitizedApiKey.includes('-') // CDP API keys typically have hyphens

    // Only set API key if it's valid
    if (isValidApiKey) {
      setApiKey(sanitizedApiKey)
    } else {
      setApiKey(undefined)
    }
    
    setIsMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null
  }

  // Render with or without API key
  // Use Base mainnet for OnchainKit to enable proper ENS/Basename resolution
  // This doesn't affect which network the wallet is connected to
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {apiKey ? (
            <OnchainKitProvider
              apiKey={apiKey}
              chain={base}
            >
              {children}
            </OnchainKitProvider>
          ) : (
            <OnchainKitProvider chain={base}>
              {children}
            </OnchainKitProvider>
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}

