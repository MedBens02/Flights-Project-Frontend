import { Flight } from './flight'
import { SearchCriteria } from './search'

export interface FlightLegSelection {
  flight: Flight | null
  rawOffer: any
  selectedSeats: string[]
  selectedLuggage: string[]
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
