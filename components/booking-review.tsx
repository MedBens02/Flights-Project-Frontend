"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import FlightCard from "@/components/flight-card"
import { useBooking } from "@/contexts/BookingContext"
import { Plane, Luggage, Users } from "lucide-react"

export default function BookingReview() {
  const { bookingState } = useBooking()
  const router = useRouter()

  const { outboundFlight, returnFlight, searchCriteria } = bookingState

  if (!outboundFlight.flight || !searchCriteria) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-card rounded-xl p-12 border border-border text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Flight Selected</h3>
          <p className="text-foreground/60 mb-6">Please start your booking from the beginning</p>
          <Button
            onClick={() => router.push('/search')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  // Calculate total price
  const calculateTotalPrice = (): number => {
    let total = 0

    // Outbound flight price
    total += outboundFlight.flight.price

    // Return flight price (if round-trip)
    if (returnFlight?.flight) {
      total += returnFlight.flight.price
    }

    // Add extras (seats + luggage) for outbound
    if (outboundFlight.extrasPrice) {
      total += outboundFlight.extrasPrice
    }

    // Add extras (seats + luggage) for return
    if (returnFlight?.extrasPrice) {
      total += returnFlight.extrasPrice
    }

    return total
  }

  const totalPrice = calculateTotalPrice()

  const handleConfirmBooking = () => {
    // Create booking reference
    const bookingReference = `BK${Date.now().toString().slice(-8)}`

    // BookingContext already persists to sessionStorage
    // Just navigate to thank-you page
    router.push(`/thank-you?ref=${bookingReference}`)
  }

  const handleEditOutboundSeats = () => {
    // Re-open outbound seat selection
    // For now, go back to outbound results
    router.push('/flights/outbound')
  }

  const handleEditReturnSeats = () => {
    // Re-open return seat selection
    router.push('/flights/return')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Review Your Booking</h2>
        <p className="text-foreground/60">
          Please review your flight selections and confirm your booking
        </p>
      </div>

      <div className="space-y-8">
        {/* Outbound Flight Section */}
        <section className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Outbound Flight
            </h3>
            <Button onClick={handleEditOutboundSeats} variant="outline" size="sm">
              Edit Selection
            </Button>
          </div>

          <FlightCard flight={outboundFlight.flight} readOnly />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected Seats */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Selected Seats</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {outboundFlight.selectedSeats.map(seat => (
                  <span key={seat} className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-semibold text-sm">
                    {seat}
                  </span>
                ))}
              </div>
            </div>

            {/* Selected Luggage */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Luggage className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Luggage</h4>
              </div>
              <ul className="space-y-1 text-sm text-foreground/80">
                {outboundFlight.selectedLuggage.includes('standard') && <li>✓ Standard Luggage (23kg)</li>}
                {outboundFlight.selectedLuggage.includes('cabin') && <li>✓ Cabin Baggage (7kg)</li>}
                {outboundFlight.selectedLuggage.includes('extra1') && <li>✓ 1st Extra Bag (+€45)</li>}
                {outboundFlight.selectedLuggage.includes('extra2') && <li>✓ 2nd Extra Bag (+€65)</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* Return Flight Section (if round-trip) */}
        {returnFlight?.flight && (
          <section className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary rotate-180" />
                Return Flight
              </h3>
              <Button onClick={handleEditReturnSeats} variant="outline" size="sm">
                Edit Selection
              </Button>
            </div>

            <FlightCard flight={returnFlight.flight} readOnly />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selected Seats */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Selected Seats</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {returnFlight.selectedSeats.map(seat => (
                    <span key={seat} className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-semibold text-sm">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected Luggage */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Luggage className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Luggage</h4>
                </div>
                <ul className="space-y-1 text-sm text-foreground/80">
                  {returnFlight.selectedLuggage.includes('standard') && <li>✓ Standard Luggage (23kg)</li>}
                  {returnFlight.selectedLuggage.includes('cabin') && <li>✓ Cabin Baggage (7kg)</li>}
                  {returnFlight.selectedLuggage.includes('extra1') && <li>✓ 1st Extra Bag (+€45)</li>}
                  {returnFlight.selectedLuggage.includes('extra2') && <li>✓ 2nd Extra Bag (+€65)</li>}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Price Summary */}
        <section className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-primary/30">
          <h3 className="text-xl font-bold text-foreground mb-4">Price Summary</h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-foreground/80">
              <span>Outbound Flight ({searchCriteria.passengers} passenger{searchCriteria.passengers > 1 ? 's' : ''})</span>
              <span className="font-semibold">€{outboundFlight.flight.price.toFixed(2)}</span>
            </div>

            {returnFlight?.flight && (
              <div className="flex justify-between text-foreground/80">
                <span>Return Flight ({searchCriteria.passengers} passenger{searchCriteria.passengers > 1 ? 's' : ''})</span>
                <span className="font-semibold">€{returnFlight.flight.price.toFixed(2)}</span>
              </div>
            )}

            {/* Extras (Seats & Luggage) */}
            {outboundFlight.extrasPrice && outboundFlight.extrasPrice > 0 && (
              <div className="flex justify-between text-foreground/80">
                <span>Outbound Extras (Seats & Luggage)</span>
                <span className="font-semibold">€{outboundFlight.extrasPrice.toFixed(2)}</span>
              </div>
            )}

            {returnFlight?.extrasPrice && returnFlight.extrasPrice > 0 && (
              <div className="flex justify-between text-foreground/80">
                <span>Return Extras (Seats & Luggage)</span>
                <span className="font-semibold">€{returnFlight.extrasPrice.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-foreground/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-foreground">Total</span>
                <span className="text-3xl font-bold text-primary">€{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/search')}
              variant="outline"
              className="flex-1"
            >
              Start Over
            </Button>
            <Button
              onClick={handleConfirmBooking}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-xl text-primary-foreground py-6 text-lg font-semibold"
            >
              Confirm Booking
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
