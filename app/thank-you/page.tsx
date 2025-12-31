"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import BookingTicket from "@/components/booking-ticket"
import { Check, Users } from "lucide-react"

interface BookingData {
  flightId: string
  selectedSeats: string[]
  selectedLuggage: string[]
  totalPrice: number
  bookingRef: string
}

interface FlightData {
  id: string
  airline: string
  departure: { city: string; time: string; date: string }
  arrival: { city: string; time: string; date: string }
  duration: string
  stops: number
  price: number
}

function ThankYouContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [flightData, setFlightData] = useState<FlightData | null>(null)
  const [searchParams_data, setSearchParamsData] = useState<any>(null)

  useEffect(() => {
    // Parse booking data from URL
    const flightId = searchParams.get("flightId")
    const seats = searchParams.get("seats")
    const luggage = searchParams.get("luggage")
    const totalPrice = searchParams.get("totalPrice")

    if (!flightId || !seats || !luggage || !totalPrice) {
      router.push("/")
      return
    }

    // Generate booking reference
    const bookingRef = `BK${Date.now().toString().slice(-8).toUpperCase()}`

    const bookingInfo: BookingData = {
      flightId,
      selectedSeats: seats.split(","),
      selectedLuggage: luggage.split(","),
      totalPrice: Number.parseInt(totalPrice),
      bookingRef,
    }

    setBookingData(bookingInfo)

    // Mock flight data - in real app, fetch from API
    const mockFlight: FlightData = {
      id: flightId,
      airline: "Air France",
      departure: { city: "CDG", time: "08:00", date: new Date().toISOString().split("T")[0] },
      arrival: { city: "LHR", time: "12:30", date: new Date().toISOString().split("T")[0] },
      duration: "2h 30m",
      stops: 0,
      price: 245,
    }

    setFlightData(mockFlight)
    setSearchParamsData({
      passengers: Number.parseInt(searchParams.get("passengers") || "1"),
      className: searchParams.get("className") || "economy",
    })
  }, [searchParams, router])

  if (!bookingData || !flightData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

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
                  <p className="text-3xl font-bold text-primary">{bookingData.bookingRef}</p>
                </div>
                <div className="text-right">
                  <p className="text-foreground/60 text-sm mb-1">Confirmation Date</p>
                  <p className="font-semibold text-foreground">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-foreground/60 text-sm">
                A confirmation email has been sent to your registered email address with all booking details.
              </p>
            </div>

            {/* Flight Details */}
            <div className="bg-white rounded-2xl p-8 border border-border shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">Flight Details</h2>

              {/* Route Display */}
              <div className="grid grid-cols-3 gap-4 items-center mb-8 pb-8 border-b border-border">
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Departure</p>
                  <p className="text-3xl font-bold text-foreground">{flightData.departure.city}</p>
                  <p className="text-foreground/60 text-sm mt-1">{flightData.departure.date}</p>
                  <p className="text-foreground font-semibold">{flightData.departure.time}</p>
                </div>
                <div className="text-center">
                  <p className="text-foreground/60 text-sm mb-2">{flightData.duration}</p>
                  <div className="w-full h-1 bg-gradient-to-r from-primary to-accent rounded mb-3"></div>
                  <p className="text-foreground/60 text-xs">
                    {flightData.stops === 0 ? "Direct" : `${flightData.stops} stop`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground/60 text-sm mb-2">Arrival</p>
                  <p className="text-3xl font-bold text-foreground">{flightData.arrival.city}</p>
                  <p className="text-foreground/60 text-sm mt-1">{flightData.arrival.date}</p>
                  <p className="text-foreground font-semibold">{flightData.arrival.time}</p>
                </div>
              </div>

              {/* Booking Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-foreground/60 text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Passengers
                  </p>
                  <p className="text-xl font-bold text-foreground">{searchParams_data.passengers}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Cabin Class</p>
                  <p className="text-xl font-bold text-foreground capitalize">{searchParams_data.className}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Selected Seats</p>
                  <p className="text-lg font-bold text-foreground">{bookingData.selectedSeats.join(", ")}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-2">Airline</p>
                  <p className="text-lg font-bold text-foreground">{flightData.airline}</p>
                </div>
              </div>
            </div>

            {/* Services Added */}
            <div className="bg-white rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-4">Services & Baggage</h3>
              <div className="space-y-3">
                {bookingData.selectedLuggage.map((luggage) => (
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
                  <span className="text-foreground/60">Base Fare</span>
                  <span className="font-semibold text-foreground">
                    €{flightData.price * searchParams_data.passengers}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Luggage</span>
                  <span className="font-semibold text-foreground">
                    €{bookingData.totalPrice - flightData.price * searchParams_data.passengers}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  €{bookingData.totalPrice}
                </span>
              </div>

              <p className="text-xs text-foreground/60 text-center mb-6">Payment has been processed successfully</p>
            </div>
          </div>
        </div>

        {/* Ticket Download Section */}
        <div className="bg-white rounded-2xl p-8 border border-border shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Booking Ticket</h2>
          <BookingTicket bookingData={bookingData} flight={flightData} searchParams={searchParams_data} />
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
