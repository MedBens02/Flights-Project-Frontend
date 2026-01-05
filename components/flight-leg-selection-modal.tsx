"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import type { Flight } from "@/types/flight"
import type { TravelClass } from "@/types/search"
import { X, Luggage, Users } from "lucide-react"
import { generateMockSeatMap } from "@/lib/mockSeatMapGenerator"
import { generateMockLuggageOptions } from "@/lib/mockUpsellGenerator"
import type { UISeat, UILuggageOption } from "@/types/amadeus"

interface FlightLegSelectionModalProps {
  flight: Flight
  rawOffer?: any
  passengers: number
  cabinClass: TravelClass
  legType: 'outbound' | 'return'
  onClose: () => void
  onConfirm: (seats: string[], luggage: string[], extrasPrice: number) => void
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

export default function FlightLegSelectionModal({
  flight,
  rawOffer,
  passengers,
  cabinClass,
  legType,
  onClose,
  onConfirm
}: FlightLegSelectionModalProps) {
  // Single itinerary (this modal handles one leg at a time)
  const itinerary = flight.itineraries[0]
  const segments = itinerary?.segments || []
  const hasMultipleSegments = segments.length > 1

  // State for multi-segment selection
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0)
  const [seatSelectionsBySegment, setSeatSelectionsBySegment] = useState<Record<number, string[]>>({})
  const [seatPricesBySegment, setSeatPricesBySegment] = useState<Record<number, Record<string, number>>>({}) // Store prices: {segmentIndex: {seatId: price}}
  const [selectedLuggage, setSelectedLuggage] = useState<string[]>(["standard-1", "cabin"])
  const [activeTab, setActiveTab] = useState<"seats" | "luggage">("seats")

  const currentSegment = segments[activeSegmentIndex]
  const firstSegment = segments[0]
  const lastSegment = segments[segments.length - 1]
  const airline = flight.airlines[0] || flight.validatingAirline

  // Get current segment's selected seats
  const selectedSeats = seatSelectionsBySegment[activeSegmentIndex] || []

  // Generate mock seat map data (regenerates when segment changes)
  const { seats: transformedSeats, columns: seatColumns, aislePositions } = useMemo(() => {
    return generateMockSeatMap(flight, cabinClass, activeSegmentIndex)
  }, [flight, cabinClass, activeSegmentIndex])

  // Generate mock luggage options
  const transformedLuggage: UILuggageOption[] = useMemo(() => {
    return generateMockLuggageOptions(cabinClass)
  }, [cabinClass])

  // Calculate max row from seats
  const seatRows = useMemo(() => {
    return transformedSeats.length > 0 ? Math.max(...transformedSeats.map(s => s.row)) : 0
  }, [transformedSeats])

  // Build 2D seat grid from mock data
  const seatGrid = useMemo(() => {
    const grid: (UISeat | null)[][] = []

    if (transformedSeats.length === 0 || seatRows === 0 || seatColumns.length === 0) {
      return grid
    }

    // Create 2D grid structure from mock seat data
    for (let row = 1; row <= seatRows; row++) {
      const rowSeats: (UISeat | null)[] = []

      for (const col of seatColumns) {
        const seat = transformedSeats.find(s => s.row === row && s.column === col)
        rowSeats.push(seat || null)
      }

      grid.push(rowSeats)
    }

    return grid
  }, [transformedSeats, seatRows, seatColumns])

  // Luggage options from mock generator
  const luggageOptions = transformedLuggage

  const handleSeatClick = (seatId: string, isBooked: boolean, isAvailable: boolean) => {
    if (isBooked || !isAvailable) return

    const currentSeats = selectedSeats
    let updatedSeats: string[]
    const seat = transformedSeats.find(s => s.id === seatId)

    if (currentSeats.includes(seatId)) {
      updatedSeats = currentSeats.filter((id) => id !== seatId)

      // Remove price from storage
      const updatedPrices = { ...(seatPricesBySegment[activeSegmentIndex] || {}) }
      delete updatedPrices[seatId]
      setSeatPricesBySegment({
        ...seatPricesBySegment,
        [activeSegmentIndex]: updatedPrices
      })
    } else if (currentSeats.length < passengers) {
      updatedSeats = [...currentSeats, seatId]

      // Store price
      if (seat) {
        setSeatPricesBySegment({
          ...seatPricesBySegment,
          [activeSegmentIndex]: {
            ...(seatPricesBySegment[activeSegmentIndex] || {}),
            [seatId]: seat.price
          }
        })
      }
    } else {
      return
    }

    setSeatSelectionsBySegment({
      ...seatSelectionsBySegment,
      [activeSegmentIndex]: updatedSeats
    })
  }

  const handleLuggageToggle = (luggageId: string) => {
    // Don't allow toggling included luggage
    const luggage = luggageOptions.find(l => l.id === luggageId)
    if (luggage?.included) return

    if (selectedLuggage.includes(luggageId)) {
      setSelectedLuggage(selectedLuggage.filter((id) => id !== luggageId))
    } else {
      setSelectedLuggage([...selectedLuggage, luggageId])
    }
  }

  // Check if all segments have complete seat selections
  const allSegmentsComplete = useMemo(() => {
    if (!hasMultipleSegments) {
      return selectedSeats.length === passengers
    }
    return segments.every((_, index) => {
      const seats = seatSelectionsBySegment[index] || []
      return seats.length === passengers
    })
  }, [hasMultipleSegments, segments, seatSelectionsBySegment, selectedSeats, passengers])

  const isCurrentSegmentComplete = selectedSeats.length === passengers

  // Calculate total price for seats and luggage
  const totalExtrasPrice = useMemo(() => {
    let total = 0

    // Add seat prices from all segments (using stored prices)
    Object.values(seatPricesBySegment).forEach(segmentPrices => {
      Object.values(segmentPrices).forEach(price => {
        total += price
      })
    })

    // Add luggage prices
    selectedLuggage.forEach(luggageId => {
      const luggage = luggageOptions.find(l => l.id === luggageId)
      if (luggage && !luggage.included) {
        total += luggage.price
      }
    })

    return total
  }, [seatPricesBySegment, selectedLuggage, luggageOptions])

  const handleConfirm = () => {
    if (allSegmentsComplete) {
      // Pass segment-wise selections and total price
      onConfirm(
        hasMultipleSegments
          ? Object.values(seatSelectionsBySegment).flat()
          : selectedSeats,
        selectedLuggage,
        totalExtrasPrice
      )
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

                {/* Segment Selector (for connecting flights) */}
                {hasMultipleSegments && (
                  <div className="mb-6">
                    <p className="text-sm text-foreground/60 mb-3">
                      This is a connecting flight. Select seats for each segment:
                    </p>
                    <div className="flex gap-2">
                      {segments.map((segment, index) => {
                        const segmentSeats = seatSelectionsBySegment[index] || []
                        const isComplete = segmentSeats.length === passengers
                        return (
                          <button
                            key={index}
                            onClick={() => setActiveSegmentIndex(index)}
                            className={`
                              flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm
                              ${activeSegmentIndex === index
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border bg-white text-foreground/60 hover:border-primary/50"
                              }
                            `}
                          >
                            <div className="font-semibold">
                              {segment.departureCity} → {segment.arrivalCity}
                            </div>
                            <div className="text-xs mt-1">
                              {isComplete ? `✓ ${passengers} seats selected` : `${segmentSeats.length}/${passengers} selected`}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <p className="text-foreground/60 mb-6">
                  {hasMultipleSegments && (
                    <span className="font-semibold">
                      Segment {activeSegmentIndex + 1}: {currentSegment.departureCity} → {currentSegment.arrivalCity} -{" "}
                    </span>
                  )}
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
                    <div className="inline-block">
                      {/* Column headers */}
                      {seatColumns.length > 0 && (
                        <div className="flex items-center gap-3 mb-2">
                          {/* Empty space for row numbers */}
                          <div className="w-6"></div>

                          {/* Column letters */}
                          <div className="flex gap-2">
                            {seatColumns.map((col, idx) => (
                              <div key={col} className="flex gap-2">
                                <div className="w-10 text-center text-xs font-semibold text-foreground/60">
                                  {col}
                                </div>
                                {aislePositions.includes(idx + 1) && (
                                  <div className="w-6 flex items-center justify-center">
                                    <div className="w-px h-4 bg-border"></div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seat rows */}
                      {seatGrid.map((rowSeats, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-3 mb-2">
                          {/* Row number */}
                          <div className="text-xs font-semibold text-foreground/60 w-6 text-right">
                            {rowIndex + 1}
                          </div>

                          {/* Row seats */}
                          <div className="flex gap-2">
                            {rowSeats.map((seat, colIndex) => {
                              if (!seat) {
                                // Empty cell (no seat at this position)
                                return (
                                  <div key={`empty-${rowIndex}-${colIndex}`} className="flex gap-2">
                                    <div className="w-10 h-10"></div>
                                    {aislePositions.includes(colIndex + 1) && (
                                      <div className="w-6 flex items-center justify-center">
                                        <div className="w-px h-10 bg-border"></div>
                                      </div>
                                    )}
                                  </div>
                                )
                              }

                              const isBooked = seat.isBooked || !seat.isAvailable

                              return (
                                <div key={seat.id} className="flex gap-2">
                                  <button
                                    onClick={() => handleSeatClick(seat.id, seat.isBooked, seat.isAvailable)}
                                    disabled={isBooked}
                                    className={`
                                      w-10 h-10 rounded-lg font-semibold text-xs transition-all duration-200 relative
                                      ${isBooked
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : selectedSeats.includes(seat.id)
                                          ? "bg-gradient-to-br from-primary to-accent text-white scale-110 shadow-lg"
                                          : "bg-white text-foreground border-2 border-primary/20 hover:border-primary hover:bg-blue-50 hover:scale-105"
                                      }
                                      ${seat.isExitRow ? "ring-2 ring-orange-400" : ""}
                                    `}
                                  >
                                    {/* Seat number */}
                                    <div className="text-[10px] font-bold leading-tight">{seat.id}</div>

                                    {/* Pricing */}
                                    {seat.price > 0 && (
                                      <div className="text-[7px] text-current opacity-80 leading-tight">
                                        +€{seat.price}
                                      </div>
                                    )}

                                    {/* Feature indicators (colored dots) */}
                                    {seat && (
                                      <div className="absolute top-0 right-0 flex gap-0.5 p-0.5">
                                        {seat.isWindow && <div className="w-1 h-1 rounded-full bg-blue-500" title="Window"></div>}
                                        {seat.isAisle && <div className="w-1 h-1 rounded-full bg-green-500" title="Aisle"></div>}
                                      </div>
                                    )}
                                  </button>
                                  {aislePositions.includes(colIndex + 1) && (
                                    <div className="w-6 flex items-center justify-center">
                                      <div className="w-px h-10 bg-border"></div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col items-center gap-3 mt-6">
                    <div className="flex justify-center gap-6 text-sm">
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
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-foreground/80">Window</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-foreground/80">Aisle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white border-2 border-orange-400 rounded"></div>
                        <span className="text-foreground/80">Exit Row</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="mt-6 space-y-3">
                  {hasMultipleSegments && !allSegmentsComplete ? (
                    <div className="flex gap-3">
                      {activeSegmentIndex > 0 && (
                        <Button
                          onClick={() => setActiveSegmentIndex(activeSegmentIndex - 1)}
                          variant="outline"
                          className="flex-1 py-6 text-lg font-semibold"
                        >
                          ← Previous Segment
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (isCurrentSegmentComplete) {
                            if (activeSegmentIndex < segments.length - 1) {
                              setActiveSegmentIndex(activeSegmentIndex + 1)
                            } else {
                              setActiveTab("luggage")
                            }
                          }
                        }}
                        disabled={!isCurrentSegmentComplete}
                        className="flex-1 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {!isCurrentSegmentComplete
                          ? `Select ${passengers - selectedSeats.length} more seat${passengers - selectedSeats.length > 1 ? "s" : ""}`
                          : activeSegmentIndex < segments.length - 1
                          ? "Next Segment →"
                          : "Continue to Luggage"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setActiveTab("luggage")}
                      disabled={!allSegmentsComplete}
                      className="w-full py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {allSegmentsComplete ? "Continue to Luggage" : `Please select ${passengers - selectedSeats.length} more seat${passengers - selectedSeats.length > 1 ? "s" : ""}`}
                    </Button>
                  )}
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
                  {luggageOptions.map((luggage) => (
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

                {/* Price Summary */}
                {totalExtrasPrice > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-foreground mb-2">Additional Charges</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(seatPricesBySegment).map(([segIndex, segmentPrices]) => {
                        const segmentTotal = Object.values(segmentPrices).reduce((sum, price) => sum + price, 0)
                        if (segmentTotal > 0) {
                          return (
                            <div key={segIndex} className="flex justify-between text-foreground/70">
                              <span>Seats {hasMultipleSegments ? `(Segment ${parseInt(segIndex) + 1})` : ''}</span>
                              <span>+€{segmentTotal}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                      {selectedLuggage.some(id => {
                        const luggage = luggageOptions.find(l => l.id === id)
                        return luggage && !luggage.included && luggage.price > 0
                      }) && (
                        <div className="flex justify-between text-foreground/70">
                          <span>Extra Luggage</span>
                          <span>+€{selectedLuggage.reduce((sum, id) => {
                            const luggage = luggageOptions.find(l => l.id === id)
                            return sum + (luggage && !luggage.included ? luggage.price : 0)
                          }, 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t border-blue-300">
                        <span>Total Extras</span>
                        <span>€{totalExtrasPrice}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm button */}
                <div className="mt-8 space-y-3">
                  <Button
                    onClick={handleConfirm}
                    disabled={!allSegmentsComplete}
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Selection {totalExtrasPrice > 0 && `(+€${totalExtrasPrice})`}
                  </Button>
                  {!allSegmentsComplete && (
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
