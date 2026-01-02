"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import BookingTicket from "@/components/booking-ticket"
import { Check, Users } from "lucide-react"

import type { Flight } from "@/types/flight"

// Helper functions for formatting
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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

interface BookingData {
  bookingReference: string
  bookingDate: string
  flight: Flight
  selectedSeats: string[]
  selectedLuggage: string[]
  totalPrice: number
  passengers: number
  className: string
  searchParams: any
}

function ThankYouContent() {
  const router = useRouter()
  const [booking, setBooking] = useState<BookingData | null>(null)

  useEffect(() => {
    // Read booking data from sessionStorage
    const stored = sessionStorage.getItem('flightBooking')

    if (!stored) {
      // No booking data found, redirect to home
      router.push("/")
      return
    }

    try {
      const bookingData = JSON.parse(stored)
      setBooking(bookingData)
      // Clear sessionStorage after reading to prevent reuse
      sessionStorage.removeItem('flightBooking')
    } catch (error) {
      console.error("Failed to parse booking data:", error)
      router.push("/")
    }
  }, [router])

  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center">Loading booking details...</div>
  }

  // Extract flight data
  const flight = booking.flight
  const isRoundTrip = flight.itineraries.length > 1

  // Outbound flight
  const outbound = flight.itineraries[0]
  const outboundFirst = outbound?.segments[0]
  const outboundLast = outbound?.segments[outbound?.segments.length - 1]

  // Return flight (if exists)
  const returnFlight = flight.itineraries[1]
  const returnFirst = returnFlight?.segments[0]
  const returnLast = returnFlight?.segments[returnFlight?.segments.length - 1]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-accent to-purple-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-white/90 text-lg">Your flight has been successfully booked</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Reference Card */}
            <div className="bg-white rounded-2xl p-8 border border-primary/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-foreground/60 text-sm mb-1">Booking Reference</p>
                  <p className="text-3xl font-bold text-primary">{booking.bookingReference}</p>
                </div>
                <div className="text-right">
                  <p className="text-foreground/60 text-sm mb-1">Confirmation Date</p>
                  <p className="font-semibold text-foreground">{formatDate(booking.bookingDate)}</p>
                </div>
              </div>
              <p className="text-foreground/60 text-sm">
                A confirmation email has been sent to your registered email address with all booking details.
              </p>
            </div>

            {/* Flight Details */}
            <div className="bg-white rounded-2xl p-8 border border-border shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {isRoundTrip ? 'Flight Details - Round Trip' : 'Flight Details'}
              </h2>

              {/* OUTBOUND Route Display */}
              <div>
                {isRoundTrip && (
                  <p className="text-foreground/80 font-semibold text-sm mb-3 uppercase tracking-wide">Outbound Flight</p>
                )}
                <div className="grid grid-cols-3 gap-4 items-center mb-8 pb-8 border-b border-border">
                  <div>
                    <p className="text-foreground/60 text-sm mb-2">Departure</p>
                    <p className="text-3xl font-bold text-foreground">{outboundFirst?.departureCity}</p>
                    <p className="text-foreground/60 text-sm mt-1">{formatDate(outboundFirst?.departureTime)}</p>
                    <p className="text-foreground font-semibold">{formatTime(outboundFirst?.departureTime)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground/60 text-sm mb-2">{formatDuration(outbound?.duration)}</p>
                    <div className="w-full h-1 bg-gradient-to-r from-primary to-accent rounded mb-3"></div>
                    <p className="text-foreground/60 text-xs">
                      {outbound?.numberOfStops === 0 ? "Direct" : `${outbound?.numberOfStops} stop${outbound?.numberOfStops > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground/60 text-sm mb-2">Arrival</p>
                    <p className="text-3xl font-bold text-foreground">{outboundLast?.arrivalCity}</p>
                    <p className="text-foreground/60 text-sm mt-1">{formatDate(outboundLast?.arrivalTime)}</p>
                    <p className="text-foreground font-semibold">{formatTime(outboundLast?.arrivalTime)}</p>
                  </div>
                </div>
              </div>

              {/* RETURN Route Display (if round-trip) */}
              {isRoundTrip && returnFlight && (
                <div>
                  <p className="text-foreground/80 font-semibold text-sm mb-3 uppercase tracking-wide">Return Flight</p>
                  <div className="grid grid-cols-3 gap-4 items-center mb-8 pb-8 border-b border-border">
                    <div>
                      <p className="text-foreground/60 text-sm mb-2">Departure</p>
                      <p className="text-3xl font-bold text-foreground">{returnFirst?.departureCity}</p>
                      <p className="text-foreground/60 text-sm mt-1">{formatDate(returnFirst?.departureTime)}</p>
                      <p className="text-foreground font-semibold">{formatTime(returnFirst?.departureTime)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-foreground/60 text-sm mb-2">{formatDuration(returnFlight?.duration)}</p>
                      <div className="w-full h-1 bg-gradient-to-r from-primary to-accent rounded mb-3"></div>
                      <p className="text-foreground/60 text-xs">
                        {returnFlight?.numberOfStops === 0 ? "Direct" : `${returnFlight?.numberOfStops} stop${returnFlight?.numberOfStops > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground/60 text-sm mb-2">Arrival</p>
                      <p className="text-3xl font-bold text-foreground">{returnLast?.arrivalCity}</p>
                      <p className="text-foreground/60 text-sm mt-1">{formatDate(returnLast?.arrivalTime)}</p>
                      <p className="text-foreground font-semibold">{formatTime(returnLast?.arrivalTime)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-foreground/60 text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Passengers
                  </p>
                  <p className="text-xl font-bold text-foreground">{booking.passengers}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Cabin Class</p>
                  <p className="text-xl font-bold text-foreground capitalize">{booking.className}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Selected Seats</p>
                  <p className="text-lg font-bold text-foreground">{booking.selectedSeats.join(", ")}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Airline</p>
                  <p className="text-lg font-bold text-foreground">{flight.airlines[0] || flight.validatingAirline}</p>
                </div>
              </div>
            </div>

            {/* Services Added */}
            <div className="bg-white rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-4">Services & Baggage</h3>
              <div className="space-y-3">
                {booking.selectedLuggage.map((luggage) => (
                  <div key={luggage} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-foreground font-medium capitalize">
                      {luggage === "standard"
                        ? "Standard Luggage"
                        : luggage === "cabin"
                          ? "Cabin Baggage"
                          : luggage === "extra1"
                            ? "1st Extra Bag"
                            : "2nd Extra Bag"}
                    </span>
                    <span className="text-accent font-semibold">✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Price Summary */}
          <div>
            <div className="bg-white rounded-2xl p-6 border border-primary/20 shadow-lg sticky top-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Price Summary</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Base Fare ({booking.passengers} {booking.passengers === 1 ? 'passenger' : 'passengers'})</span>
                  <span className="font-semibold text-foreground">
                    {flight.currency}{(flight.price * booking.passengers).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Additional Services</span>
                  <span className="font-semibold text-foreground">
                    {flight.currency}{(booking.totalPrice - flight.price * booking.passengers).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {flight.currency}{booking.totalPrice.toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-foreground/60 text-center mb-6">Payment has been processed successfully</p>
            </div>
          </div>
        </div>

        {/* Ticket Download Section */}
        <div className="bg-white rounded-2xl p-8 border border-border shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Booking Ticket</h2>
          <BookingTicket bookingData={booking} flight={flight} searchParams={booking.searchParams} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/")} variant="outline" className="px-8 py-6 text-lg font-semibold">
            Back to Search
          </Button>
          <Button className="px-8 py-6 text-lg font-semibold bg-primary hover:bg-primary/90">View My Bookings</Button>
        </div>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  )
}
