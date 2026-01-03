"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plane, ArrowRight, Clock } from "lucide-react"
import type { Flight } from "@/types/flight"

interface FlightCardProps {
  flight: Flight
  onBook?: () => void
  readOnly?: boolean
}

// Utility functions for formatting
function formatTime(isoDateTime: string): string {
  if (!isoDateTime) return ""
  try {
    const date = new Date(isoDateTime)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return isoDateTime
  }
}

function formatDate(isoDateTime: string): string {
  if (!isoDateTime) return ""
  try {
    const date = new Date(isoDateTime)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return isoDateTime
  }
}

function formatDuration(isoDuration: string): string {
  if (!isoDuration || !isoDuration.startsWith('PT')) return isoDuration

  try {
    const duration = isoDuration.substring(2) // Remove "PT"
    let result = ""

    const hIndex = duration.indexOf('H')
    if (hIndex > 0) {
      const hours = duration.substring(0, hIndex)
      result += `${hours}h `
    }

    const mIndex = duration.indexOf('M')
    if (mIndex > 0) {
      const startIndex = hIndex > 0 ? hIndex + 1 : 0
      const minutes = duration.substring(startIndex, mIndex)
      result += `${minutes}m`
    }

    return result.trim()
  } catch {
    return isoDuration
  }
}

function calculateLayover(arrivalTime: string, nextDepartureTime: string): string {
  try {
    const arrival = new Date(arrivalTime)
    const departure = new Date(nextDepartureTime)
    const diffMs = departure.getTime() - arrival.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60

    if (hours > 0) {
      return ` ${hours}h ${minutes}m`
    }
    return ` ${minutes}m`
  } catch {
    return " -"
  }
}

export default function FlightCard({ flight, onBook, readOnly = false }: FlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Single itinerary (outbound or standalone flight)
  const itinerary = flight.itineraries[0]
  const firstSegment = itinerary?.segments[0]
  const lastSegment = itinerary?.segments[itinerary?.segments.length - 1]

  const handleCardClick = () => {
    if (!readOnly && itinerary.numberOfStops > 0) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card expansion when clicking book button
    onBook?.()
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-card rounded-xl border p-6 transition-all duration-300 ${
        readOnly
          ? 'border-primary/50 opacity-90'
          : 'border-border'
      } ${
        !readOnly && itinerary.numberOfStops > 0
          ? 'cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]'
          : ''
      }`}
    >
      {/* FLIGHT INFORMATION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Airline Info */}
        <div className="md:col-span-2">
          <div className="font-semibold text-foreground mb-2">
            {flight.airlines.join(', ')}
          </div>
          <div className="text-xs text-foreground/60 space-y-1">
            <div>Flight #{flight.id.substring(0, 8)}</div>
            <div className="inline-flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded-full text-xs font-medium">
              {itinerary.numberOfStops === 0 ? "Direct" : `${itinerary.numberOfStops} stop${itinerary.numberOfStops > 1 ? "s" : ""}`}
              {itinerary.numberOfStops > 0 && (
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
          </div>
        </div>

        {/* Departure Time */}
        <div className="md:col-span-2">
          <div className="text-2xl font-bold text-foreground">{formatTime(firstSegment?.departureTime)}</div>
          <div className="text-sm text-foreground/60">{firstSegment?.departureCity}</div>
          <div className="text-xs text-foreground/40">{formatDate(firstSegment?.departureTime)}</div>
        </div>

        {/* Duration & Stops */}
        <div className="md:col-span-2 text-center">
          <div className="text-sm font-semibold text-primary mb-1">{formatDuration(itinerary.duration)}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-foreground/60">
            <div className="flex-1 h-px bg-border"></div>
            <span>{itinerary.numberOfStops === 0 ? "✓ Direct" : `${itinerary.numberOfStops} stop`}</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
        </div>

        {/* Arrival Time */}
        <div className="md:col-span-2">
          <div className="text-2xl font-bold text-foreground">{formatTime(lastSegment?.arrivalTime)}</div>
          <div className="text-sm text-foreground/60">{lastSegment?.arrivalCity}</div>
          <div className="text-xs text-foreground/40">{formatDate(lastSegment?.arrivalTime)}</div>
        </div>

        {/* Seat Availability */}
        <div className="md:col-span-1 text-center">
          <div className="text-xs text-foreground/60 mb-1">Seats</div>
          <div className={`font-bold text-lg ${flight.seats <= 5 ? "text-destructive" : "text-accent"}`}>
            {flight.seats}
          </div>
        </div>

        {/* Price & Book */}
        <div className="md:col-span-3 text-right">
          <div className="text-sm text-foreground/60 mb-2">From</div>
          <div className="text-3xl font-bold text-primary mb-3">{flight.currency}{flight.price.toFixed(2)}</div>
          {!readOnly && onBook && (
            <Button onClick={handleBookClick} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              Select
            </Button>
          )}
        </div>
      </div>

      {/* Expanded segment details */}
      {isExpanded && (
        <div className="col-span-full border-t mt-6 pt-6">
          {/* FLIGHT SEGMENTS */}
          {itinerary.numberOfStops > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Flight Details
              </h3>

              {itinerary.segments.map((segment, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  {/* Segment header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {segment.airlineName} {segment.flightNumber}
                      </span>
                      {segment.aircraftCode && (
                        <span className="text-foreground/60">({segment.aircraftCode})</span>
                      )}
                    </div>
                  </div>

                  {/* Segment route */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Departure */}
                    <div>
                      <div className="font-semibold text-lg text-foreground">{formatTime(segment.departureTime)}</div>
                      <div className="text-sm text-foreground/80">
                        {segment.departureCity} ({segment.departureAirport})
                      </div>
                      <div className="text-xs text-foreground/60">{formatDate(segment.departureTime)}</div>
                    </div>

                    {/* Duration */}
                    <div className="text-center flex flex-col items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-foreground/60 mb-1" />
                      <div className="text-xs text-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(segment.duration)}
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-right">
                      <div className="font-semibold text-lg text-foreground">{formatTime(segment.arrivalTime)}</div>
                      <div className="text-sm text-foreground/80">
                        {segment.arrivalCity} ({segment.arrivalAirport})
                      </div>
                      <div className="text-xs text-foreground/60">{formatDate(segment.arrivalTime)}</div>
                    </div>
                  </div>

                  {/* Layover indicator */}
                  {idx < itinerary.segments.length - 1 && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          Layover in {itinerary.segments[idx + 1].departureCity}:
                          {calculateLayover(segment.arrivalTime, itinerary.segments[idx + 1].departureTime)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
