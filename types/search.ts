import { Airport } from './airport'

export type TripType = 'oneway' | 'roundtrip'  // Match current app
export type TravelClass = 'economy' | 'business' | 'first'  // Match current app

export interface SearchCriteria {
  tripType: TripType
  origin: Airport | null
  destination: Airport | null
  departureDate: string  // ISO date string
  returnDate?: string
  passengers: number  // Current app uses single number, guide uses object
  travelClass: TravelClass
}
