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
}

export interface Itinerary {
  duration: string
  segments: Segment[]
  numberOfStops: number
}

export interface Flight {
  id: string
  price: number
  currency: string
  seats: number
  itineraries: Itinerary[]
  airlines: string[]
  validatingAirline: string
  totalDuration: string
  totalStops: number
}
