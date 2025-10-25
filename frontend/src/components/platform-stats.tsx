'use client'

import { useAccount, useReadContract } from 'wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'

export function PlatformStats() {
  const { address } = useAccount()

  const { data: totalPassports } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalPassports',
  })

  const { data: totalEvents } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalEvents',
  })

  // Get user's stamps count (events attended)
  const { data: userStamps } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getPassportStamps',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const eventsAttended = userStamps ? userStamps.length : 0

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Total Passports */}
      <StatCard
        icon="🎫"
        label="Total Passports"
        value={totalPassports?.toString() || '0'}
        description="Minted on Base Sepolia"
        color="blue"
      />

      {/* Total Events */}
      <StatCard
        icon="🎪"
        label="Active Events"
        value={totalEvents?.toString() || '0'}
        description="Available to attend"
        color="purple"
      />

      {/* Events Attended (Personal) */}
      <StatCard
        icon="✅"
        label={address ? "Events Attended" : "Your Events"}
        value={eventsAttended.toString()}
        description={address ? "Your stamp collection" : "Connect to see yours"}
        color="green"
        highlight={!!address}
      />
    </div>
  )
}

interface StatCardProps {
  icon: string
  label: string
  value: string
  description: string
  color: 'blue' | 'purple' | 'green'
  highlight?: boolean
}

function StatCard({ icon, label, value, description, color, highlight }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  }

  const borderClasses = {
    blue: 'border-blue-300 dark:border-blue-700',
    purple: 'border-purple-300 dark:border-purple-700',
    green: 'border-green-300 dark:border-green-700',
  }

  return (
    <div 
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 ${
        highlight ? borderClasses[color] : 'border-gray-200 dark:border-gray-700'
      } hover:shadow-xl transition-all duration-300 overflow-hidden`}
    >
      {/* Background Gradient Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full blur-2xl`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="text-5xl mb-3">{icon}</div>
        
        {/* Value */}
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {value}
        </div>
        
        {/* Label */}
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </div>
        
        {/* Description */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
        
        {/* Progress Bar (visual accent) */}
        <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full animate-pulse`}
            style={{ width: '60%' }}
          />
        </div>
      </div>
    </div>
  )
}

