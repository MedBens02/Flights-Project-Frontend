import { Airport } from '@/types/airport'
import { Flight } from '@/types/flight'
import { SearchCriteria } from '@/types/search'
import { MOCK_AIRPORTS, generateMockFlights } from './mockData'

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
