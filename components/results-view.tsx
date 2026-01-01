"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import FlightCard from "@/components/flight-card"
import FlightDetailsModal from "@/components/flight-details-modal"
import type { Flight, SearchParams } from "@/app/page"

interface ResultsViewProps {
  flights: Flight[]
  rawOffers: Record<string, any>
  searchParams: SearchParams
  onModifySearch: (params: SearchParams) => void
}

type SortOption = "price-asc" | "price-desc" | "duration-asc" | "duration-desc" | "departure-asc"
type FilterStop = "all" | "direct" | "oneStop" | "any"

export default function ResultsView({ flights, rawOffers, searchParams, onModifySearch }: ResultsViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>("price-asc")
  const [filterStops, setFilterStops] = useState<FilterStop>("all")
  const [departureTimeFilter, setDepartureTimeFilter] = useState("all")
  const [showModifySearch, setShowModifySearch] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)

  // Parse duration string to minutes for sorting
  const durationToMinutes = (duration: string): number => {
    const match = duration.match(/(\d+)h\s*(\d+)?m?/)
    if (!match) return 0
    const hours = Number.parseInt(match[1])
    const minutes = Number.parseInt(match[2] || "0")
    return hours * 60 + minutes
  }

  // Filter and sort flights
  const processedFlights = useMemo(() => {
    const filtered = flights.filter((flight) => {
      // Filter by stops
      if (filterStops === "direct" && flight.stops !== 0) return false
      if (filterStops === "oneStop" && flight.stops !== 1) return false

      // Filter by departure time
      if (departureTimeFilter !== "all") {
        const hour = Number.parseInt(flight.departure.time.split(":")[0])
        if (departureTimeFilter === "morning" && (hour < 6 || hour >= 12)) return false
        if (departureTimeFilter === "afternoon" && (hour < 12 || hour >= 18)) return false
        if (departureTimeFilter === "evening" && hour < 18) return false
      }

      return true
    })

    // Sort flights
    filtered.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      if (sortBy === "duration-asc") return durationToMinutes(a.duration) - durationToMinutes(b.duration)
      if (sortBy === "duration-desc") return durationToMinutes(b.duration) - durationToMinutes(a.duration)
      if (sortBy === "departure-asc") return a.departure.time.localeCompare(b.departure.time)
      return 0
    })

    return filtered
  }, [flights, sortBy, filterStops, departureTimeFilter])

  return (
    <div className="mt-12">
      {/* Results Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Flight Results</h2>
        <p className="text-foreground/60">
          Found {processedFlights.length} flights
          {searchParams.returnDate && ` for ${searchParams.passengers} passenger(s)`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-6 border border-border sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Filters & Sort</h3>
              <Button
                onClick={() => setShowModifySearch(!showModifySearch)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Modify
              </Button>
            </div>

            {/* Sort Options */}
            <div className="mb-8">
              <h4 className="font-semibold text-foreground mb-3">Sort By</h4>
              <div className="space-y-2">
                {[
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "duration-asc", label: "Duration: Short to Long" },
                  { value: "duration-desc", label: "Duration: Long to Short" },
                  { value: "departure-asc", label: "Departure: Early to Late" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer hover:bg-secondary p-2 rounded transition-colors"
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stops Filter */}
            <div className="mb-8 pb-8 border-b border-border">
              <h4 className="font-semibold text-foreground mb-3">Stops</h4>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Flights" },
                  { value: "direct", label: "Direct Only" },
                  { value: "oneStop", label: "1 Stop" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer hover:bg-secondary p-2 rounded transition-colors"
                  >
                    <input
                      type="radio"
                      name="stops"
                      value={option.value}
                      checked={filterStops === option.value}
                      onChange={(e) => setFilterStops(e.target.value as FilterStop)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Departure Time Filter */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Departure Time</h4>
              <div className="space-y-2">
                {[
                  { value: "all", label: "Any Time" },
                  { value: "morning", label: "Morning (6AM-12PM)" },
                  { value: "afternoon", label: "Afternoon (12PM-6PM)" },
                  { value: "evening", label: "Evening (6PM+)" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer hover:bg-secondary p-2 rounded transition-colors"
                  >
                    <input
                      type="radio"
                      name="departure"
                      value={option.value}
                      checked={departureTimeFilter === option.value}
                      onChange={(e) => setDepartureTimeFilter(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-3">
          {processedFlights.length > 0 ? (
            <div className="space-y-4">
              {processedFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} onBook={() => setSelectedFlight(flight)} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-12 border border-border text-center">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No flights found</h3>
              <p className="text-foreground/60 mb-6">Try adjusting your filters or search criteria</p>
              <Button
                onClick={() => setShowModifySearch(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Modify Search
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Flight Details Modal */}
      {selectedFlight && (
        <FlightDetailsModal
          flight={selectedFlight}
          rawOffer={rawOffers[selectedFlight.id]}
          searchParams={searchParams}
          onClose={() => setSelectedFlight(null)}
          onConfirm={(bookingData) => {
            console.log("Booking confirmed:", bookingData)
            // Handle booking confirmation here
          }}
        />
      )}
    </div>
  )
}
