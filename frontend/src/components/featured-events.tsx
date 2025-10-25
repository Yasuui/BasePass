'use client'

import { useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { basePassAddress, basePassABI } from '@/config/contract'
import { Avatar, Name } from '@coinbase/onchainkit/identity'

export function FeaturedEvents() {
  const { data: totalEvents } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalEvents',
  })

  if (!totalEvents || totalEvents === 0n) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-6xl mb-4">🎪</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          No Events Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Check back soon for exciting events to attend!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Featured Events 🎉
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: Number(totalEvents) }, (_, i) => (
          <EventCard key={i + 1} eventId={i + 1} />
        ))}
      </div>
    </div>
  )
}

function EventCard({ eventId }: { eventId: number }) {
  const { data: event } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getEvent',
    args: [BigInt(eventId)],
  })

  if (!event) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
    )
  }

  // Use iconUrl as the external event link if provided, otherwise show placeholder
  const eventLink = event.iconUrl || '#'
  const hasExternalLink = event.iconUrl && event.iconUrl.startsWith('http')

  return (
    <div className="relative group">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
        {/* Event Image/Icon Placeholder */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-6xl">🎪</span>
        </div>

        {/* Event Content */}
        <div className="p-6">
          {/* Event Name */}
          <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white line-clamp-2">
            {event.name}
          </h3>

          {/* Event Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {event.description}
          </p>

          {/* Organizer Info */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Organizer:</span>
            <div className="flex items-center gap-1">
              <Avatar address={event.signer} className="w-4 h-4" />
              <Name
                address={event.signer}
                chain={base}
                className="text-xs font-mono text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>

          {/* Call to Action */}
          {hasExternalLink ? (
            <a
              href={eventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Learn More & Join</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-center text-sm">
              Event details coming soon
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Claim stamps at the event with organizer's QR code
          </p>
        </div>

        {/* Event ID Badge */}
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg border border-gray-200 dark:border-gray-700">
          #{eventId}
        </div>
      </div>
    </div>
  )
}

