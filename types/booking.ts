import { Flight } from './flight'
import { SearchCriteria } from './search'
import { SeatMapData, UpsellFlightOffer } from './amadeus'

export interface FlightLegSelection {
  flight: Flight | null
  rawOffer: any
  selectedSeats: string[]
  selectedLuggage: string[]
  extrasPrice?: number  // Total price for seats and extra luggage

  // Cache transformed API data
  seatMapData?: SeatMapData[]
  upsellData?: UpsellFlightOffer[]
}

export interface SearchResults {
  flights: Flight[]
  rawOffers: Record<string, any>
}

export interface BookingState {
  searchCriteria: SearchCriteria | null
  outboundFlight: FlightLegSelection
  returnFlight: FlightLegSelection | null
  currentStep: BookingStep
  outboundSearchResults: SearchResults | null
  returnSearchResults: SearchResults | null
}

export type BookingStep =
  | 'search'
  | 'outbound-results'
  | 'outbound-seats'
  | 'return-results'
  | 'return-seats'
  | 'review'
