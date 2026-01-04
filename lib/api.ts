import { Airport } from '@/types/airport'
import { Flight } from '@/types/flight'
import { SearchCriteria } from '@/types/search'
import { MOCK_AIRPORTS, generateMockFlights } from './mockData'
import type { SeatMapRequest, SeatMapResponse, UpsellRequest, UpsellResponse } from '@/types/amadeus'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7001/api'
const USE_MOCK_DATA = false  // Backend is now ready!

/**
 * Search airports by keyword (name, city, IATA code)
 * Backend endpoint: GET /api/airports/search?keyword={query}
 */
export async function searchAirports(keyword: string): Promise<Airport[]> {
  if (USE_MOCK_DATA) {
    // Client-side filtering of mock data
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate network delay
    return MOCK_AIRPORTS.filter(airport =>
      airport.cityName.toLowerCase().includes(keyword.toLowerCase()) ||
      airport.name.toLowerCase().includes(keyword.toLowerCase()) ||
      airport.iataCode.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 10)
  }

  // Real backend call (for when backend is ready)
  const res = await fetch(`${API_BASE_URL}/airports/search?keyword=${encodeURIComponent(keyword)}`)
  if (!res.ok) throw new Error('Failed to fetch airports')
  return res.json()
}

/**
 * Search flights based on criteria
 * Backend endpoint: POST /api/flights/search
 * Returns both mapped flights and raw Amadeus offers (needed for SeatMap API)
 */
export async function searchFlights(criteria: SearchCriteria): Promise<{
  flights: Flight[]
  rawOffers: Record<string, any>
}> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate network delay
    const flights = generateMockFlights(criteria)
    // Mock data doesn't have raw offers
    return { flights, rawOffers: {} }
  }

  // Real backend call
  const res = await fetch(`${API_BASE_URL}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originLocationCode: criteria.origin?.iataCode,
      destinationLocationCode: criteria.destination?.iataCode,
      departureDate: criteria.departureDate + 'T00:00:00Z',
      returnDate: criteria.returnDate ? criteria.returnDate + 'T00:00:00Z' : null,
      adults: criteria.passengers,  // Will need to adjust when using guide's passenger object
      travelClass: criteria.travelClass.toUpperCase(),
    }),
  })
  if (!res.ok) throw new Error('Failed to search flights')

  // Backend now returns { flights: Flight[], rawOffers: Record<string, any> }
  return res.json()
}

/**
 * Search only outbound flights (one-way search)
 * Backend endpoint: POST /api/flights/search (with returnDate=null)
 */
export async function searchOutboundFlights(criteria: SearchCriteria): Promise<{
  flights: Flight[]
  rawOffers: Record<string, any>
}> {
  const res = await fetch(`${API_BASE_URL}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originLocationCode: criteria.origin?.iataCode,
      destinationLocationCode: criteria.destination?.iataCode,
      departureDate: criteria.departureDate + 'T00:00:00Z',
      returnDate: null, // Force one-way search
      adults: criteria.passengers,
      travelClass: criteria.travelClass.toUpperCase(),
    }),
  })
  if (!res.ok) throw new Error('Failed to search outbound flights')
  return res.json()
}

/**
 * Search only return flights (one-way search with swapped origin/destination)
 * Backend endpoint: POST /api/flights/search (with departure date = return date)
 */
export async function searchReturnFlights(criteria: SearchCriteria): Promise<{
  flights: Flight[]
  rawOffers: Record<string, any>
}> {
  if (!criteria.returnDate) throw new Error('Return date required')

  const res = await fetch(`${API_BASE_URL}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originLocationCode: criteria.destination?.iataCode,  // SWAPPED
      destinationLocationCode: criteria.origin?.iataCode,  // SWAPPED
      departureDate: criteria.returnDate + 'T00:00:00Z',
      returnDate: null, // One-way search
      adults: criteria.passengers,
      travelClass: criteria.travelClass.toUpperCase(),
    }),
  })
  if (!res.ok) throw new Error('Failed to search return flights')
  return res.json()
}

/**
 * Get seat map for a flight offer
 * Amadeus API: POST /v1/shopping/seatmaps
 */
export async function getSeatMap(flightOffer: any): Promise<SeatMapResponse> {
  console.log('📡 getSeatMap called with:', flightOffer)
  console.log('📡 flightOffer ID:', flightOffer?.id)
  console.log('📡 flightOffer keys:', Object.keys(flightOffer || {}))
  console.log('📡 flightOffer itineraries:', flightOffer?.itineraries)
  console.log('📡 flightOffer travelerPricings:', flightOffer?.travelerPricings)

  if (!flightOffer) {
    throw new Error('Flight offer is required for seat map lookup')
  }

  const requestBody: SeatMapRequest = {
    data: [{
      type: 'flight-offer',
      id: flightOffer.id || '1',
      source: flightOffer.source || 'GDS',
      itineraries: flightOffer.itineraries || [],
      travelerPricings: flightOffer.travelerPricings || [],
      ...flightOffer
    }]
  }

  console.log('📡 Request body being sent:', JSON.stringify(requestBody, null, 2))

  const res = await fetch(`${API_BASE_URL}/seatmaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch seat map: ${res.status}`)
  }

  return res.json()
}

/**
 * Get flight upsell options (cabin upgrades, branded fares)
 * Amadeus API: POST /v1/shopping/flight-offers/upselling
 */
export async function getFlightUpsells(flightOffer: any): Promise<UpsellResponse> {
  console.log('📡 getFlightUpsells called with:', flightOffer)
  console.log('📡 flightOffer ID:', flightOffer?.id)
  console.log('📡 flightOffer keys:', Object.keys(flightOffer || {}))

  if (!flightOffer) {
    throw new Error('Flight offer is required for upsell lookup')
  }

  const requestBody: UpsellRequest = {
    data: {
      type: 'flight-offers-upselling',
      flightOffers: [flightOffer]
    }
  }

  console.log('📡 Request body being sent:', JSON.stringify(requestBody, null, 2))

  const res = await fetch(`${API_BASE_URL}/upsells`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch flight upsells: ${res.status}`)
  }

  return res.json()
}
