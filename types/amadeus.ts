// SeatMap Display API v1.9
export interface SeatMapRequest {
  data: Array<{
    type: 'flight-offer'
    id: string
    source: string
    itineraries: any[]
    travelerPricings: any[]
    [key: string]: any
  }>
}

export interface Seat {
  cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  number: string  // "12B"
  characteristicsCodes?: string[]  // ["1A", "W", "A"]
  travelerPricing: Array<{
    travelerId: string
    seatAvailabilityStatus: 'AVAILABLE' | 'BLOCKED' | 'OCCUPIED'
    price?: {
      currency: string
      total: string
      base: string
    }
  }>
}

export interface Deck {
  deckType: 'UPPER' | 'MAIN' | 'LOWER'
  deckConfiguration: {
    width: number
    length: number
    startSeatRow?: number
    endSeatRow?: number
  }
  seats: Seat[]
}

export interface SeatMapData {
  type: 'seatmap'
  flightOfferId: string
  segmentId: string
  carrierCode: string
  number: string
  decks: Deck[]
}

export interface SeatMapResponse {
  data: SeatMapData[]
}

// Branded Fares Upsell API v1.0
export interface UpsellRequest {
  data: {
    type: 'flight-offers-upselling'
    flightOffers: any[]
  }
}

export interface UpsellFlightOffer {
  type: 'flight-offer'
  id: string
  price: {
    currency: string
    total: string
    additionalServices?: Array<{
      amount: string
      type: 'CHECKED_BAGS' | 'MEALS' | 'SEATS' | 'OTHER_SERVICES'
    }>
  }
  travelerPricings: Array<{
    fareDetailsBySegment: Array<{
      cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
      includedCheckedBags?: {
        quantity?: number
        weight?: number
        weightUnit?: string
      }
    }>
  }>
}

export interface UpsellResponse {
  data: UpsellFlightOffer[]
}

// UI Transformation Types
export interface UISeat {
  id: string
  row: number
  column: string
  isBooked: boolean
  isAvailable: boolean
  price: number
  currency: string
  cabin: string
  // Seat characteristics
  isWindow?: boolean
  isAisle?: boolean
  isExitRow?: boolean
  hasRestrictedRecline?: boolean
}

export interface UILuggageOption {
  id: string
  label: string
  weight: string
  price: number
  included: boolean
}
