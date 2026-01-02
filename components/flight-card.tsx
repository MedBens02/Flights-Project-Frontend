"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plane, ArrowRight, Clock } from "lucide-react"
import type { Flight } from "@/types/flight"

interface FlightCardProps {
  flight: Flight
  onBook: () => void
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

export default function FlightCard({ flight, onBook }: FlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Detect round-trip
  const isRoundTrip = flight.itineraries.length > 1

  // Outbound flight segments
  const outbound = flight.itineraries[0]
  const outboundFirstSegment = outbound?.segments[0]
  const outboundLastSegment = outbound?.segments[outbound?.segments.length - 1]

  // Return flight segments (if exists)
  const returnFlight = flight.itineraries[1]
  const returnFirstSegment = returnFlight?.segments[0]
  const returnLastSegment = returnFlight?.segments[returnFlight?.segments.length - 1]

  const handleCardClick = () => {
    if (flight.totalStops > 0 || isRoundTrip) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card expansion when clicking book button
    onBook()
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-card rounded-xl border border-border p-6 transition-all duration-300 ${
        (flight.totalStops > 0 || isRoundTrip) ? 'cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]' : ''
      }`}
    >
      {/* OUTBOUND FLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Airline Info */}
        <div className="md:col-span-2">
          {isRoundTrip && (
            <div className="text-xs text-primary font-semibold mb-1 uppercase">Outbound</div>
          )}
          <div className="font-semibold text-foreground mb-2">
            {flight.airlines.join(', ')}
          </div>
          <div className="text-xs text-foreground/60 space-y-1">
            <div>Flight #{flight.id.substring(0, 8)}</div>
            <div className="inline-flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded-full text-xs font-medium">
              {outbound.numberOfStops === 0 ? "Direct" : `${outbound.numberOfStops} stop${outbound.numberOfStops > 1 ? "s" : ""}`}
              {(outbound.numberOfStops > 0 || isRoundTrip) && (
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
          </div>
        </div>

        {/* Departure Time */}
        <div className="md:col-span-2">
          <div className="text-2xl font-bold text-foreground">{formatTime(outboundFirstSegment?.departureTime)}</div>
          <div className="text-sm text-foreground/60">{outboundFirstSegment?.departureCity}</div>
          <div className="text-xs text-foreground/40">{formatDate(outboundFirstSegment?.departureTime)}</div>
        </div>

        {/* Duration & Stops */}
        <div className="md:col-span-2 text-center">
          <div className="text-sm font-semibold text-primary mb-1">{formatDuration(outbound.duration)}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-foreground/60">
            <div className="flex-1 h-px bg-border"></div>
            <span>{outbound.numberOfStops === 0 ? "✓ Direct" : `${outbound.numberOfStops} stop`}</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
        </div>

        {/* Arrival Time */}
        <div className="md:col-span-2">
          <div className="text-2xl font-bold text-foreground">{formatTime(outboundLastSegment?.arrivalTime)}</div>
          <div className="text-sm text-foreground/60">{outboundLastSegment?.arrivalCity}</div>
          <div className="text-xs text-foreground/40">{formatDate(outboundLastSegment?.arrivalTime)}</div>
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
          <div className="text-sm text-foreground/60 mb-2">{isRoundTrip ? 'Total Price' : 'From'}</div>
          <div className="text-3xl font-bold text-primary mb-3">{flight.currency}{flight.price.toFixed(2)}</div>
          <Button onClick={handleBookClick} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
            Select
          </Button>
        </div>
      </div>

      {/* RETURN FLIGHT (if round-trip) */}
      {isRoundTrip && returnFlight && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-6 pt-6 border-t border-border">
          {/* Airline Info */}
          <div className="md:col-span-2">
            <div className="text-xs text-primary font-semibold mb-1 uppercase">Return</div>
            <div className="font-semibold text-foreground mb-2">
              {returnFirstSegment?.airlineName}
            </div>
            <div className="text-xs text-foreground/60 space-y-1">
              <div>Flight #{returnFirstSegment?.flightNumber}</div>
              <div className="inline-flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded-full text-xs font-medium">
                {returnFlight.numberOfStops === 0 ? "Direct" : `${returnFlight.numberOfStops} stop${returnFlight.numberOfStops > 1 ? "s" : ""}`}
              </div>
            </div>
          </div>

          {/* Departure Time */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold text-foreground">{formatTime(returnFirstSegment?.departureTime)}</div>
            <div className="text-sm text-foreground/60">{returnFirstSegment?.departureCity}</div>
            <div className="text-xs text-foreground/40">{formatDate(returnFirstSegment?.departureTime)}</div>
          </div>

          {/* Duration & Stops */}
          <div className="md:col-span-2 text-center">
            <div className="text-sm font-semibold text-primary mb-1">{formatDuration(returnFlight.duration)}</div>
            <div className="flex items-center justify-center gap-1 text-xs text-foreground/60">
              <div className="flex-1 h-px bg-border"></div>
              <span>{returnFlight.numberOfStops === 0 ? "✓ Direct" : `${returnFlight.numberOfStops} stop`}</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
          </div>

          {/* Arrival Time */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold text-foreground">{formatTime(returnLastSegment?.arrivalTime)}</div>
            <div className="text-sm text-foreground/60">{returnLastSegment?.arrivalCity}</div>
            <div className="text-xs text-foreground/40">{formatDate(returnLastSegment?.arrivalTime)}</div>
          </div>

          {/* Empty space to align with outbound */}
          <div className="md:col-span-4"></div>
        </div>
      )}

      {/* Expanded segment details */}
      {isExpanded && (
        <div className="col-span-full border-t mt-6 pt-6">
          {/* OUTBOUND SEGMENTS */}
          {outbound.numberOfStops > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                {isRoundTrip ? 'Outbound Flight Details' : 'Flight Details'}
              </h3>

              {outbound.segments.map((segment, idx) => (
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
                  {idx < outbound.segments.length - 1 && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          Layover in {outbound.segments[idx + 1].departureCity}:
                          {calculateLayover(segment.arrivalTime, outbound.segments[idx + 1].departureTime)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RETURN SEGMENTS (if round-trip with stops) */}
          {isRoundTrip && returnFlight && returnFlight.numberOfStops > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Return Flight Details
              </h3>

              {returnFlight.segments.map((segment, idx) => (
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
                  {idx < returnFlight.segments.length - 1 && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          Layover in {returnFlight.segments[idx + 1].departureCity}:
                          {calculateLayover(segment.arrivalTime, returnFlight.segments[idx + 1].departureTime)}
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
