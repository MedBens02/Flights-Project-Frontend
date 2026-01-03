"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import FlightCard from "@/components/flight-card"
import FlightLegSelectionModal from "@/components/flight-leg-selection-modal"
import { useBooking } from "@/contexts/BookingContext"
import { useReturnSearch } from "@/hooks/useReturnSearch"
import type { Flight } from "@/types/flight"

type SortOption = "price-asc" | "price-desc" | "duration-asc" | "duration-desc" | "departure-asc"
type FilterStop = "all" | "direct" | "oneStop"

export default function ReturnResultsView() {
  const { bookingState, selectReturnFlight, updateReturnSeats, setReturnSearchResults, updateSearchCriteria } = useBooking()
  const { isPending, error, mutate: searchReturn } = useReturnSearch()
  const router = useRouter()

  const [sortBy, setSortBy] = useState<SortOption>("price-asc")
  const [filterStops, setFilterStops] = useState<FilterStop>("all")
  const [departureTimeFilter, setDepartureTimeFilter] = useState("all")
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)

  const searchCriteria = bookingState.searchCriteria
  const outboundFlight = bookingState.outboundFlight.flight
  const [customReturnDate, setCustomReturnDate] = useState(searchCriteria?.returnDate || "")
  // Read from context instead of mutation state for persistence
  const searchResults = bookingState.returnSearchResults
  const flights = searchResults?.flights || []
  const rawOffers = searchResults?.rawOffers || {}

  // Auto-search on mount
  useEffect(() => {
    if (searchCriteria && searchCriteria.returnDate) {
      searchReturn(searchCriteria, {
        onSuccess: (data) => {
          // Save search results to context for persistence
          setReturnSearchResults(data.flights, data.rawOffers)
        }
      })
    }
  }, [])

  // Parse ISO duration to minutes for sorting
  const durationToMinutes = (isoDuration: string): number => {
    if (!isoDuration || !isoDuration.startsWith('PT')) return 0
    try {
      const duration = isoDuration.substring(2)
      let minutes = 0

      const hIndex = duration.indexOf('H')
      if (hIndex > 0) {
        minutes += parseInt(duration.substring(0, hIndex)) * 60
      }

      const mIndex = duration.indexOf('M')
      if (mIndex > 0) {
        const startIndex = hIndex > 0 ? hIndex + 1 : 0
        minutes += parseInt(duration.substring(startIndex, mIndex))
      }

      return minutes
    } catch {
      return 0
    }
  }

  // Extract departure hour from ISO datetime
  const getDepartureHour = (isoDateTime: string): number => {
    try {
      const date = new Date(isoDateTime)
      return date.getHours()
    } catch {
      return 0
    }
  }

  // Filter and sort flights
  const processedFlights = useMemo(() => {
    const filtered = flights.filter((flight) => {
      const itinerary = flight.itineraries[0]
      const firstSegment = itinerary?.segments[0]

      // Filter by stops
      if (filterStops === "direct" && itinerary.numberOfStops !== 0) return false
      if (filterStops === "oneStop" && itinerary.numberOfStops !== 1) return false

      // Filter by departure time
      if (departureTimeFilter !== "all" && firstSegment) {
        const hour = getDepartureHour(firstSegment.departureTime)
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
      if (sortBy === "duration-asc") return durationToMinutes(a.totalDuration) - durationToMinutes(b.totalDuration)
      if (sortBy === "duration-desc") return durationToMinutes(b.totalDuration) - durationToMinutes(a.totalDuration)
      if (sortBy === "departure-asc") {
        const aTime = a.itineraries[0]?.segments[0]?.departureTime || ''
        const bTime = b.itineraries[0]?.segments[0]?.departureTime || ''
        return aTime.localeCompare(bTime)
      }
      return 0
    })

    return filtered
  }, [flights, sortBy, filterStops, departureTimeFilter])

  const handleChangeDateAndSearch = () => {
    if (!customReturnDate || !searchCriteria) return

    // Update context with new return date
    updateSearchCriteria({ returnDate: customReturnDate })

    // Re-search with new date
    const updatedCriteria = {
      ...searchCriteria,
      returnDate: customReturnDate
    }
    searchReturn(updatedCriteria, {
      onSuccess: (data) => {
        setReturnSearchResults(data.flights, data.rawOffers)
      }
    })
  }

  const handleFlightSelect = (flight: Flight) => {
    setSelectedFlight(flight)
  }

  const handleConfirmSelection = (seats: string[], luggage: string[]) => {
    if (selectedFlight) {
      // Save selected return flight to booking context
      selectReturnFlight(selectedFlight, rawOffers[selectedFlight.id])

      // Save seat and luggage selections
      updateReturnSeats(seats, luggage)

      // Navigate to review step
      router.push('/review')

      setSelectedFlight(null)
    }
  }

  const handleChangeOutbound = () => {
    router.push('/flights/outbound')
  }

  const handleBackToSearch = () => {
    router.push('/search')
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Searching for return flights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-card rounded-xl p-12 border border-border text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Error Loading Return Flights</h3>
          <p className="text-foreground/60 mb-6">{error instanceof Error ? error.message : 'Failed to load flights'}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleChangeOutbound} variant="outline">
              Change Outbound
            </Button>
            <Button
              onClick={() => searchCriteria && searchReturn(searchCriteria)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!outboundFlight) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-card rounded-xl p-12 border border-border text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Outbound Flight Selected</h3>
          <p className="text-foreground/60 mb-6">Please select an outbound flight first</p>
          <Button
            onClick={handleBackToSearch}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Selected Outbound Flight */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Your Selected Outbound Flight</h3>
          <Button onClick={handleChangeOutbound} variant="outline" size="sm">
            Change Outbound Flight
          </Button>
        </div>
        <FlightCard flight={outboundFlight} readOnly />
      </div>

      {/* Return Results Header */}
      <div className="mb-8 mt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Select Your Return Flight</h2>
            <p className="text-foreground/60">
              {searchCriteria?.destination?.cityName} → {searchCriteria?.origin?.cityName} • {processedFlights.length} flight{processedFlights.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button onClick={handleBackToSearch} variant="outline">
            Modify Search
          </Button>
        </div>
      </div>

      {/* Return Date Editor */}
      <div className="mb-6 bg-card rounded-xl p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Adjust Return Date</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Not finding the right flight? Try searching for a different return date while keeping your selected outbound flight.
        </p>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-foreground/70 mb-2 block uppercase tracking-wider">
              Return Date
            </label>
            <Input
              type="date"
              value={customReturnDate}
              onChange={(e) => setCustomReturnDate(e.target.value)}
              className="w-full bg-white text-foreground border-2 border-blue-100/50 rounded-xl focus:border-primary focus:shadow-lg transition-all"
            />
          </div>
          <Button
            onClick={handleChangeDateAndSearch}
            disabled={isPending || !customReturnDate || customReturnDate === searchCriteria?.returnDate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending ? "Searching..." : "Search New Date"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-6 border border-border sticky top-8">
            <h3 className="text-lg font-bold text-foreground mb-6">Filters & Sort</h3>

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
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onBook={() => handleFlightSelect(flight)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-12 border border-border text-center">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No return flights found</h3>
              <p className="text-foreground/60 mb-6">Try adjusting your filters or change your outbound flight</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleChangeOutbound} variant="outline">
                  Change Outbound Flight
                </Button>
                <Button
                  onClick={handleBackToSearch}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Modify Search
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flight Leg Selection Modal */}
      {selectedFlight && searchCriteria && (
        <FlightLegSelectionModal
          flight={selectedFlight}
          rawOffer={rawOffers[selectedFlight.id]}
          passengers={searchCriteria.passengers}
          cabinClass={searchCriteria.travelClass}
          legType="return"
          onClose={() => setSelectedFlight(null)}
          onConfirm={handleConfirmSelection}
        />
      )}
    </div>
  )
}
