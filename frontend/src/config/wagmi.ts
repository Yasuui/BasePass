import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors'

// Get RPC URL from env or use default
const baseSepoliaRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// Configure chains & providers with multiple wallet connectors
export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({
      appName: 'BasePass',
      appLogoUrl: 'https://basepass.app/icon.png',
      preference: 'smartWalletOnly', // Prioritize Smart Wallet for Base users
    }),
    metaMask({
      dappMetadata: {
        name: 'BasePass',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://basepass.app',
      },
    }),
    injected(), // Fallback for other injected wallets
  ],
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
    [base.id]: http('https://mainnet.base.org'),
  },
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

