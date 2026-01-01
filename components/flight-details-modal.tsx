"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Flight } from "@/types/flight"
import { X, Luggage, Users, AlertCircle } from "lucide-react"

interface FlightDetailsModalProps {
  flight: Flight
  searchParams: any
  onClose: () => void
  onConfirm: (bookingData: any) => void
}

// Helper functions to extract data from new Flight structure
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
    const duration = isoDuration.substring(2)
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

const SEAT_CLASSES = {
  economy: { price: 0, rows: 8, seatsPerRow: 6 },
  business: { price: 150, rows: 4, seatsPerRow: 6 },
  first: { price: 300, rows: 2, seatsPerRow: 4 },
}

const LUGGAGE_OPTIONS = [
  { id: "standard", label: "Standard Luggage", weight: "23kg", price: 0, included: true },
  { id: "extra1", label: "1st Extra Bag", weight: "23kg", price: 45, included: false },
  { id: "extra2", label: "2nd Extra Bag", weight: "23kg", price: 65, included: false },
  { id: "cabin", label: "Cabin Baggage", weight: "7kg", price: 0, included: true },
]

export default function FlightDetailsModal({ flight, searchParams, onClose, onConfirm }: FlightDetailsModalProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedLuggage, setSelectedLuggage] = useState<string[]>(["standard", "cabin"])
  const [activeTab, setActiveTab] = useState<"seats" | "luggage" | "review">("seats")

  // Extract first and last segments from itinerary
  const firstSegment = flight.itineraries[0]?.segments[0]
  const lastSegment = flight.itineraries[0]?.segments[flight.itineraries[0]?.segments.length - 1]
  const airline = flight.airlines[0] || flight.validatingAirline

  const generateSeats = () => {
    const seats = []
    const totalPassengers = searchParams.passengers || 1
    const seatsConfig = SEAT_CLASSES[searchParams.className || "economy"]

    for (let row = 1; row <= seatsConfig.rows; row++) {
      for (let col = 0; col < seatsConfig.seatsPerRow; col++) {
        const seatId = `${String.fromCharCode(65 + col)}${row}`
        const isBooked = Math.random() > 0.7 // 30% booked seats
        seats.push({
          id: seatId,
          isBooked,
          isSelected: selectedSeats.includes(seatId),
        })
      }
    }
    return seats
  }

  const seats = generateSeats()
  const maxSeatsSelectable = searchParams.passengers || 1
  const totalLuggagePrice = selectedLuggage
    .filter((id) => id !== "standard" && id !== "cabin")
    .reduce((sum, id) => {
      const luggage = LUGGAGE_OPTIONS.find((l) => l.id === id)
      return sum + (luggage?.price || 0)
    }, 0)

  const totalPrice =
    flight.price * (searchParams.passengers || 1) +
    totalLuggagePrice +
    (searchParams.className === "business" ? SEAT_CLASSES.business.price * (searchParams.passengers || 1) : 0) +
    (searchParams.className === "first" ? SEAT_CLASSES.first.price * (searchParams.passengers || 1) : 0)

  const handleSeatClick = (seatId: string, isBooked: boolean) => {
    if (isBooked) return
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId))
    } else if (selectedSeats.length < maxSeatsSelectable) {
      setSelectedSeats([...selectedSeats, seatId])
    }
  }

  const handleLuggageToggle = (luggageId: string) => {
    if (luggageId === "standard" || luggageId === "cabin") return
    if (selectedLuggage.includes(luggageId)) {
      setSelectedLuggage(selectedLuggage.filter((id) => id !== luggageId))
    } else {
      setSelectedLuggage([...selectedLuggage, luggageId])
    }
  }

  const isSeatsComplete = selectedSeats.length === maxSeatsSelectable

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-accent to-purple-500 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{airline}</h2>
              <p className="text-white/90 text-sm">Flight {flight.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Flight Summary */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/80 mb-1">Departure</p>
              <p className="font-bold text-lg">{formatTime(firstSegment?.departureTime)}</p>
              <p className="text-white/90">{firstSegment?.departureCity}</p>
            </div>
            <div className="text-center">
              <p className="text-white/80 mb-1">Duration</p>
              <p className="font-bold">{formatDuration(flight.totalDuration)}</p>
              <p className="text-white/90">{flight.totalStops === 0 ? "Direct" : `${flight.totalStops} stop`}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 mb-1">Arrival</p>
              <p className="font-bold text-lg">{formatTime(lastSegment?.arrivalTime)}</p>
              <p className="text-white/90">{lastSegment?.arrivalCity}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border sticky top-[150px] bg-white z-10">
          <button
            onClick={() => setActiveTab("seats")}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === "seats"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Seat Selection
          </button>
          <button
            onClick={() => setActiveTab("luggage")}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === "luggage"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Luggage className="w-4 h-4 inline mr-2" />
            Luggage
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === "review"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Review & Confirm
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Seat Selection Tab */}
          {activeTab === "seats" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Select {maxSeatsSelectable} Seat{maxSeatsSelectable > 1 ? "s" : ""}
                </h3>
                <p className="text-foreground/60 mb-6">
                  {isSeatsComplete
                    ? "✓ All seats selected"
                    : `${maxSeatsSelectable - selectedSeats.length} seat${maxSeatsSelectable - selectedSeats.length !== 1 ? "s" : ""} remaining`}
                </p>
              </div>

              {/* Cabin Layout */}
              <div className="bg-gradient-to-b from-blue-50 to-transparent p-8 rounded-xl border border-primary/20">
                <div className="flex justify-center mb-8">
                  <div className="text-center">
                    <p className="text-sm text-foreground/60 font-semibold mb-4">FRONT OF CABIN</p>
                    <div className="space-y-2 inline-block">
                      {Array.from({ length: SEAT_CLASSES[searchParams.className || "economy"].rows }).map(
                        (_, rowIdx) => (
                          <div key={rowIdx} className="flex gap-3">
                            {Array.from({
                              length: SEAT_CLASSES[searchParams.className || "economy"].seatsPerRow,
                            }).map((_, colIdx) => {
                              const seatNum = String.fromCharCode(65 + colIdx)
                              const seatId = `${seatNum}${rowIdx + 1}`
                              const seat = seats.find((s) => s.id === seatId)
                              return (
                                <button
                                  key={seatId}
                                  onClick={() => handleSeatClick(seatId, seat?.isBooked || false)}
                                  disabled={seat?.isBooked}
                                  className={`w-10 h-10 rounded-lg font-bold text-xs transition-all duration-200 ${
                                    seat?.isBooked
                                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                      : seat?.isSelected
                                        ? "bg-gradient-to-br from-primary to-accent text-white scale-110 shadow-lg"
                                        : "bg-white border-2 border-primary/20 text-foreground hover:border-primary hover:bg-blue-50"
                                  }`}
                                >
                                  {seatId}
                                </button>
                              )
                            })}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border-2 border-primary/20 rounded" />
                    <span className="text-sm text-foreground/60">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded" />
                    <span className="text-sm text-foreground/60">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded" />
                    <span className="text-sm text-foreground/60">Booked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Luggage Tab */}
          {activeTab === "luggage" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Select Your Luggage</h3>
                <p className="text-foreground/60 mb-6">Customize your baggage allowance</p>
              </div>

              <div className="space-y-3">
                {LUGGAGE_OPTIONS.map((luggage) => (
                  <div
                    key={luggage.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedLuggage.includes(luggage.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${luggage.included ? "opacity-75" : ""}`}
                    onClick={() => !luggage.included && handleLuggageToggle(luggage.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedLuggage.includes(luggage.id)}
                          onChange={() => !luggage.included && handleLuggageToggle(luggage.id)}
                          disabled={luggage.included}
                          className="mt-1 w-5 h-5 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-foreground">{luggage.label}</p>
                          <p className="text-sm text-foreground/60">{luggage.weight}</p>
                          {luggage.included && <p className="text-xs text-accent font-semibold mt-1">✓ Included</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        {luggage.price > 0 && <p className="font-bold text-primary">+€{luggage.price}</p>}
                        {luggage.included && <p className="text-xs text-foreground/60">Free</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === "review" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-6">Review Your Booking</h3>
              </div>

              {/* Booking Summary */}
              <div className="space-y-4 bg-blue-50 rounded-xl p-6 border border-primary/20">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Flight Details</p>
                  <p className="font-bold text-foreground">
                    {firstSegment?.departureCity} → {lastSegment?.arrivalCity}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {formatDate(firstSegment?.departureTime)} | {formatTime(firstSegment?.departureTime)} - {formatTime(lastSegment?.arrivalTime)}
                  </p>
                </div>

                <div className="pt-4 border-t border-primary/10">
                  <p className="text-sm text-foreground/60 mb-2">Selected Seats</p>
                  <p className="font-bold text-foreground">{selectedSeats.join(", ") || "No seats selected"}</p>
                </div>

                <div className="pt-4 border-t border-primary/10">
                  <p className="text-sm text-foreground/60 mb-2">Luggage</p>
                  <div className="space-y-1">
                    {selectedLuggage.map((id) => {
                      const luggage = LUGGAGE_OPTIONS.find((l) => l.id === id)
                      return (
                        <p key={id} className="text-sm text-foreground">
                          {luggage?.label}
                          {luggage?.price ? ` (+€${luggage.price})` : " (Included)"}
                        </p>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/10">
                  <p className="text-sm text-foreground/60 mb-2">Passengers</p>
                  <p className="font-bold text-foreground">
                    {searchParams.passengers} x €{flight.price}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Base Flight</span>
                  <span className="font-semibold text-foreground">
                    €{flight.price * (searchParams.passengers || 1)}
                  </span>
                </div>
                {totalLuggagePrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Extra Luggage</span>
                    <span className="font-semibold text-foreground">€{totalLuggagePrice}</span>
                  </div>
                )}
                {(searchParams.className === "business" || searchParams.className === "first") && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Premium Cabin</span>
                    <span className="font-semibold text-foreground">
                      €
                      {(searchParams.className === "business"
                        ? SEAT_CLASSES.business.price
                        : SEAT_CLASSES.first.price) * (searchParams.passengers || 1)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-primary/20 flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    €{totalPrice}
                  </span>
                </div>
              </div>

              {!isSeatsComplete && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    Please select all {maxSeatsSelectable} seat{maxSeatsSelectable > 1 ? "s" : ""} before confirming
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-border bg-white p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab !== "seats" && (
            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === "luggage") setActiveTab("seats")
                else setActiveTab("luggage")
              }}
            >
              Back
            </Button>
          )}
          {activeTab === "seats" && (
            <Button
              onClick={() => setActiveTab("luggage")}
              disabled={!isSeatsComplete}
              className="bg-primary hover:bg-primary/90"
            >
              Next: Luggage
            </Button>
          )}
          {activeTab === "luggage" && (
            <Button onClick={() => setActiveTab("review")} className="bg-primary hover:bg-primary/90">
              Review Booking
            </Button>
          )}
          {activeTab === "review" && (
            <Button
              onClick={() => {
                const bookingRef = `BK${Date.now().toString().slice(-8).toUpperCase()}`
                const params = new URLSearchParams({
                  flightId: flight.id,
                  seats: selectedSeats.join(","),
                  luggage: selectedLuggage.join(","),
                  totalPrice: totalPrice.toString(),
                  passengers: (searchParams.passengers || 1).toString(),
                  className: searchParams.className || "economy",
                })
                window.location.href = `/thank-you?${params.toString()}`
              }}
              disabled={!isSeatsComplete}
              className="bg-accent hover:bg-accent/90 text-white font-bold"
            >
              Confirm & Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
