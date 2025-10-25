'use client'

import { useAccount, useReadContract } from 'wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { eventStampAddress, eventStampABI } from '@/config/stamp-contract'

interface StampCollectionProps {
  passportId?: bigint
}

export function StampCollection({ passportId }: StampCollectionProps) {
  const { address } = useAccount()

  // Get all stamp token IDs for this passport owner
  const { data: stampIds, isLoading } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getPassportStamps',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-40"
          />
        ))}
      </div>
    )
  }

  if (!stampIds || stampIds.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎫</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          No stamps yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Claim your first stamp at an event to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stampIds.map((stampId) => (
        <StampCard key={stampId.toString()} stampId={stampId} />
      ))}
    </div>
  )
}

interface StampCardProps {
  stampId: bigint
}

function StampCard({ stampId }: StampCardProps) {
  // Get stamp metadata
  const { data: metadata } = useReadContract({
    address: eventStampAddress,
    abi: eventStampABI,
    functionName: 'stampMetadata',
    args: [stampId],
  })

  // Get event details
  const { data: event } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getEvent',
    args: metadata ? [metadata[0]] : undefined,
    query: {
      enabled: !!metadata,
    },
  })

  if (!metadata || !event) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-40" />
    )
  }

  const [eventId, passportId, timestamp] = metadata
  const claimedDate = new Date(Number(timestamp) * 1000).toLocaleDateString()

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Stamp Badge */}
        <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
          #{stampId.toString()}
        </div>

        {/* Event Icon/Emoji */}
        <div className="text-5xl mb-3">
          {event.iconUrl || '🎪'}
        </div>

        {/* Event Name */}
        <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
          {event.name}
        </h4>

        {/* Event Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {event.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="font-medium">Event ID:</span>
            <span>#{eventId.toString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Claimed:</span>
            <span>{claimedDate}</span>
          </div>
        </div>

        {/* Verified Badge */}
        <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Verified On-Chain
        </div>
      </div>
    </div>
  )
}

