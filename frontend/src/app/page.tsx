import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { MintPassport } from '@/components/mint-passport'
import { PassportViewer } from '@/components/passport-viewer'
import { FeaturedEvents } from '@/components/featured-events'
import { PlatformStats } from '@/components/platform-stats'

export default function Home() {
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
                  Onchain Event Passport
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link 
                href="/passport" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
              Your Onchain Event Passport
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Collect verifiable attendance stamps on Base network
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">🎟️</div>
              <h3 className="text-lg font-semibold mb-2">Mint Passport</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get your unique onchain passport NFT to start collecting stamps
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">📸</div>
              <h3 className="text-lg font-semibold mb-2">Scan QR Codes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Claim event stamps by scanning QR codes at events
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-lg font-semibold mb-2">Verified Onchain</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All attendance data is permanently stored on Base blockchain
              </p>
            </div>
          </div>

          {/* Passport Status */}
          <PassportViewer />

          {/* Mint Section */}
          <MintPassport />

          {/* Platform Statistics */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Platform Overview 📊
            </h2>
            <PlatformStats />
          </div>

          {/* Featured Events */}
          <div className="mt-16">
            <FeaturedEvents />
          </div>

          {/* Contract Info */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-12">
            <p className="mb-2">Contracts deployed on Base Sepolia</p>
            <div className="space-y-1">
              <div>
                <span className="text-xs text-gray-500">BasePass: </span>
                <a
                  href="https://sepolia.basescan.org/address/0xc0e383eA06121965B55747a1F14F3837B122B94a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono text-xs"
                >
                  0xc0e383eA06121965B55747a1F14F3837B122B94a
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500">EventStamp: </span>
                <a
                  href="https://sepolia.basescan.org/address/0x564A4fc33651F0F20376bB967660703b3BA9B9d2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono text-xs"
                >
                  0x564A4fc33651F0F20376bB967660703b3BA9B9d2
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
