export interface Segment {
  departureAirport: string      // IATA code
  departureCity: string
  arrivalAirport: string
  arrivalCity: string
  departureTime: string         // ISO datetime
  arrivalTime: string
  flightNumber: string
  airlineCode: string
  airlineName: string
  duration: string              // ISO duration "PT2H30M"
  sequenceNumber: number
  aircraftCode: string
  availableSeats?: number       // Per-segment seat availability (optional for backward compatibility)
}

export interface Itinerary {
  duration: string
  segments: Segment[]
  numberOfStops: number
}

export interface Flight {
  id: string
  price: number  // Price for the selected/default cabin
  currency: string
  seats: number
  itineraries: Itinerary[]
  airlines: string[]
  validatingAirline: string
  totalDuration: string
  totalStops: number

  // Optional cabin-specific pricing (for showing all class options)
  cabinPrices?: {
    economy: number
    business: number
    first: number
  }
}
