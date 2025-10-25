'use client'

import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { readContract } from '@wagmi/core'
import { config } from '@/config/wagmi'
import { basePassAddress, basePassABI } from '@/config/contract'
import { WalletConnect } from '@/components/wallet-connect'
import { CreateEvent } from '@/components/create-event'
import { QRGenerator } from '@/components/qr-generator'
import { Name, Avatar } from '@coinbase/onchainkit/identity'

export default function AdminPage() {
  const { isConnected, address } = useAccount()
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [userEvents, setUserEvents] = useState<number[]>([])

  const { data: totalEvents } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'totalEvents',
  })

  // Filter events to show only ones where user is the signer
  React.useEffect(() => {
    async function filterUserEvents() {
      if (!address || !totalEvents || totalEvents === 0n) {
        setUserEvents([])
        return
      }

      const userEventIds: number[] = []
      for (let i = 1; i <= Number(totalEvents); i++) {
        try {
          const event = await readContract(config, {
            address: basePassAddress,
            abi: basePassABI,
            functionName: 'getEvent',
            args: [BigInt(i)],
          })
          
          if (event.signer.toLowerCase() === address.toLowerCase()) {
            userEventIds.push(i)
          }
        } catch (error) {
          console.error(`Error fetching event ${i}:`, error)
        }
      }
      
      setUserEvents(userEventIds)
    }

    filterUserEvents()
  }, [address, totalEvents])

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
                  Event Management
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
                className="text-gray-900 dark:text-white font-semibold"
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
        <div className="max-w-6xl mx-auto">
          {!isConnected ? (
            <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to create events
              </p>
              <WalletConnect />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Create Event */}
              <div className="space-y-6">
                <CreateEvent />
                
                {/* Events List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Your Events</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Your Created Events: {userEvents.length}
                  </p>
                  
                  {userEvents.length > 0 ? (
                    <div className="space-y-3">
                      {userEvents.map((eventId) => (
                        <EventListItem 
                          key={eventId} 
                          eventId={eventId}
                          isSelected={selectedEventId === eventId}
                          onSelect={() => setSelectedEventId(eventId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">🎪</div>
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        You haven't created any events yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Create an event above to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - QR Generator */}
              <div>
                {selectedEventId ? (
                  <QRGenerator eventId={selectedEventId} />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select an event to generate QR codes
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function EventListItem({ 
  eventId, 
  isSelected, 
  onSelect 
}: { 
  eventId: number
  isSelected: boolean
  onSelect: () => void 
}) {
  const { data: event } = useReadContract({
    address: basePassAddress,
    abi: basePassABI,
    functionName: 'getEvent',
    args: [BigInt(eventId)],
  })

  if (!event) return null

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {event.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {event.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500">Signer:</span>
            <div className="flex items-center gap-1">
              <Avatar address={event.signer} className="w-4 h-4" />
              <Name
                address={event.signer}
                chain={base}
                className="text-xs font-mono text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
            Event ID: {eventId}
          </p>
        </div>
        {isSelected && (
          <div className="text-blue-600 text-xl">✓</div>
        )}
      </div>
    </button>
  )
}

