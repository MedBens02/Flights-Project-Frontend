"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import type { Flight } from "@/types/flight"
import type { TravelClass } from "@/types/search"
import { X, Luggage, Users } from "lucide-react"

interface FlightLegSelectionModalProps {
  flight: Flight
  rawOffer?: any
  passengers: number
  cabinClass: TravelClass
  legType: 'outbound' | 'return'
  onClose: () => void
  onConfirm: (seats: string[], luggage: string[]) => void
}

// Helper functions to extract data from Flight structure
function formatTime(isoDateTime: string): string {
  if (!isoDateTime) return ""
  try {
    const date = new Date(isoDateTime)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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
  premium_economy: { price: 75, rows: 6, seatsPerRow: 6 },
  business: { price: 150, rows: 4, seatsPerRow: 6 },
  first: { price: 300, rows: 2, seatsPerRow: 4 },
}

const LUGGAGE_OPTIONS = [
  { id: "standard", label: "Standard Luggage", weight: "23kg", price: 0, included: true },
  { id: "extra1", label: "1st Extra Bag", weight: "23kg", price: 45, included: false },
  { id: "extra2", label: "2nd Extra Bag", weight: "23kg", price: 65, included: false },
  { id: "cabin", label: "Cabin Baggage", weight: "7kg", price: 0, included: true },
]

export default function FlightLegSelectionModal({
  flight,
  rawOffer,
  passengers,
  cabinClass,
  legType,
  onClose,
  onConfirm
}: FlightLegSelectionModalProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedLuggage, setSelectedLuggage] = useState<string[]>(["standard", "cabin"])
  const [activeTab, setActiveTab] = useState<"seats" | "luggage">("seats")

  // Single itinerary (this modal handles one leg at a time)
  const itinerary = flight.itineraries[0]
  const firstSegment = itinerary?.segments[0]
  const lastSegment = itinerary?.segments[itinerary?.segments.length - 1]

  const airline = flight.airlines[0] || flight.validatingAirline

  // Deterministic pseudo-random function using flight ID as seed
  const seededRandom = (seed: string, index: number): number => {
    const hash = seed.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const combined = (hash + index) * 2654435761;
    return (combined % 100) / 100;
  };

  // Generate seats with useMemo - only regenerates when flight changes
  const seats = useMemo(() => {
    const result = []
    const seatsConfig = SEAT_CLASSES[cabinClass]
    const totalSeats = seatsConfig.rows * seatsConfig.seatsPerRow
    const availableSeats = flight.seats

    // Calculate how many seats should be booked
    const bookedSeatsCount = Math.max(0, totalSeats - availableSeats)
    const bookedProbability = bookedSeatsCount / totalSeats

    for (let row = 1; row <= seatsConfig.rows; row++) {
      for (let col = 0; col < seatsConfig.seatsPerRow; col++) {
        const seatId = `${String.fromCharCode(65 + col)}${row}`
        const seatIndex = (row - 1) * seatsConfig.seatsPerRow + col

        const randomValue = seededRandom(flight.id, seatIndex)
        const isBooked = randomValue < bookedProbability

        result.push({
          id: seatId,
          isBooked,
          isSelected: false
        })
      }
    }
    return result
  }, [flight.id, cabinClass, flight.seats])

  const handleSeatClick = (seatId: string, isBooked: boolean) => {
    if (isBooked) return
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId))
    } else if (selectedSeats.length < passengers) {
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

  const isSeatsComplete = selectedSeats.length === passengers

  const handleConfirm = () => {
    if (isSeatsComplete) {
      onConfirm(selectedSeats, selectedLuggage)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-accent to-purple-500 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{legType === 'outbound' ? 'Outbound Flight' : 'Return Flight'}</h2>
              <p className="text-white/90 text-sm">{airline} - Flight {flight.id}</p>
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
              <p className="font-bold">{formatDuration(itinerary.duration)}</p>
              <p className="text-white/90">{itinerary.numberOfStops === 0 ? "Direct" : `${itinerary.numberOfStops} stop`}</p>
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
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Seat Selection Tab */}
          {activeTab === "seats" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Select {passengers} Seat{passengers > 1 ? "s" : ""}
                </h3>
                <p className="text-foreground/60 mb-6">
                  {selectedSeats.length} of {passengers} seat{passengers > 1 ? "s" : ""} selected
                </p>

                {/* Seat Map */}
                <div className="bg-gradient-to-b from-blue-50/50 to-white rounded-2xl p-6 border border-blue-100">
                  {/* Airplane front indicator */}
                  <div className="text-center mb-6">
                    <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold">
                      ✈ Front of Aircraft
                    </div>
                  </div>

                  {/* Seat grid */}
                  <div className="flex justify-center">
                    <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${SEAT_CLASSES[cabinClass].seatsPerRow}, 2.5rem)` }}>
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat.id, seat.isBooked)}
                          disabled={seat.isBooked}
                          className={`
                            w-10 h-10 rounded-lg font-semibold text-xs transition-all duration-200
                            ${seat.isBooked
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : selectedSeats.includes(seat.id)
                                ? "bg-gradient-to-br from-primary to-accent text-white scale-110 shadow-lg"
                                : "bg-white text-foreground border-2 border-primary/20 hover:border-primary hover:bg-blue-50 hover:scale-105"
                            }
                          `}
                        >
                          {seat.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white border-2 border-primary/20 rounded"></div>
                      <span className="text-foreground/80">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded"></div>
                      <span className="text-foreground/80">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <span className="text-foreground/80">Occupied</span>
                    </div>
                  </div>
                </div>

                {/* Next button */}
                <div className="mt-6">
                  <Button
                    onClick={() => setActiveTab("luggage")}
                    disabled={!isSeatsComplete}
                    className="w-full py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSeatsComplete ? "Continue to Luggage" : `Please select ${passengers - selectedSeats.length} more seat${passengers - selectedSeats.length > 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Luggage Tab */}
          {activeTab === "luggage" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Luggage Options</h3>
                <p className="text-foreground/60 mb-6">
                  Standard luggage and cabin baggage are included. Add extra bags if needed.
                </p>

                {/* Luggage options */}
                <div className="space-y-3">
                  {LUGGAGE_OPTIONS.map((luggage) => (
                    <div
                      key={luggage.id}
                      className={`
                        p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${selectedLuggage.includes(luggage.id)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-white hover:border-primary/50 hover:bg-blue-50/50"
                        }
                        ${luggage.included ? "opacity-75" : ""}
                      `}
                      onClick={() => !luggage.included && handleLuggageToggle(luggage.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Luggage className={`w-5 h-5 ${selectedLuggage.includes(luggage.id) ? "text-primary" : "text-foreground/60"}`} />
                          <div>
                            <p className="font-semibold text-foreground">
                              {luggage.label}
                              {luggage.included && <span className="ml-2 text-xs text-primary">(Included)</span>}
                            </p>
                            <p className="text-sm text-foreground/60">{luggage.weight}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {luggage.price > 0 ? (
                            <p className="font-bold text-primary">+€{luggage.price}</p>
                          ) : (
                            <p className="text-sm text-foreground/60">Free</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Confirm button */}
                <div className="mt-8 space-y-3">
                  <Button
                    onClick={handleConfirm}
                    disabled={!isSeatsComplete}
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Selection
                  </Button>
                  {!isSeatsComplete && (
                    <p className="text-center text-sm text-destructive">
                      Please select all seats before confirming
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
