import { Airport } from '@/types/airport'
import { Flight } from '@/types/flight'
import { SearchCriteria } from '@/types/search'

export const MOCK_AIRPORTS: Airport[] = [
  // Europe
  { iataCode: 'CDG', name: 'Charles de Gaulle Airport', cityName: 'Paris', countryName: 'France', lat: 49.0097, lng: 2.5479 },
  { iataCode: 'LHR', name: 'London Heathrow Airport', cityName: 'London', countryName: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  { iataCode: 'AMS', name: 'Amsterdam Schiphol Airport', cityName: 'Amsterdam', countryName: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  { iataCode: 'FCO', name: 'Leonardo da Vinci Airport', cityName: 'Rome', countryName: 'Italy', lat: 41.8003, lng: 12.2389 },
  { iataCode: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', cityName: 'Madrid', countryName: 'Spain', lat: 40.4719, lng: -3.5626 },
  { iataCode: 'BCN', name: 'Barcelona-El Prat Airport', cityName: 'Barcelona', countryName: 'Spain', lat: 41.2974, lng: 2.0833 },
  { iataCode: 'MUC', name: 'Munich Airport', cityName: 'Munich', countryName: 'Germany', lat: 48.3537, lng: 11.7750 },
  { iataCode: 'FRA', name: 'Frankfurt Airport', cityName: 'Frankfurt', countryName: 'Germany', lat: 50.0379, lng: 8.5622 },
  { iataCode: 'VIE', name: 'Vienna International Airport', cityName: 'Vienna', countryName: 'Austria', lat: 48.1103, lng: 16.5697 },
  { iataCode: 'ZRH', name: 'Zurich Airport', cityName: 'Zurich', countryName: 'Switzerland', lat: 47.4582, lng: 8.5556 },
  { iataCode: 'BRU', name: 'Brussels Airport', cityName: 'Brussels', countryName: 'Belgium', lat: 50.9010, lng: 4.4856 },
  { iataCode: 'MIL', name: 'Milan Malpensa Airport', cityName: 'Milan', countryName: 'Italy', lat: 45.6306, lng: 8.7231 },
  { iataCode: 'PRG', name: 'Václav Havel Airport Prague', cityName: 'Prague', countryName: 'Czech Republic', lat: 50.1008, lng: 14.2600 },
  { iataCode: 'LIS', name: 'Lisbon Portela Airport', cityName: 'Lisbon', countryName: 'Portugal', lat: 38.7756, lng: -9.1354 },
  { iataCode: 'DUB', name: 'Dublin Airport', cityName: 'Dublin', countryName: 'Ireland', lat: 53.4213, lng: -6.2701 },
  { iataCode: 'CPH', name: 'Copenhagen Airport', cityName: 'Copenhagen', countryName: 'Denmark', lat: 55.6180, lng: 12.6508 },
  { iataCode: 'ARN', name: 'Stockholm Arlanda Airport', cityName: 'Stockholm', countryName: 'Sweden', lat: 59.6519, lng: 17.9186 },
  { iataCode: 'OSL', name: 'Oslo Gardermoen Airport', cityName: 'Oslo', countryName: 'Norway', lat: 60.1939, lng: 11.1004 },
  { iataCode: 'ATH', name: 'Athens International Airport', cityName: 'Athens', countryName: 'Greece', lat: 37.9364, lng: 23.9445 },
  { iataCode: 'IST', name: 'Istanbul Airport', cityName: 'Istanbul', countryName: 'Turkey', lat: 41.2753, lng: 28.7519 },

  // North America
  { iataCode: 'JFK', name: 'John F. Kennedy International', cityName: 'New York', countryName: 'United States', lat: 40.6413, lng: -73.7781 },
  { iataCode: 'LAX', name: 'Los Angeles International', cityName: 'Los Angeles', countryName: 'United States', lat: 33.9416, lng: -118.4085 },
  { iataCode: 'ORD', name: "O'Hare International Airport", cityName: 'Chicago', countryName: 'United States', lat: 41.9742, lng: -87.9073 },
  { iataCode: 'MIA', name: 'Miami International Airport', cityName: 'Miami', countryName: 'United States', lat: 25.7959, lng: -80.2870 },
  { iataCode: 'SFO', name: 'San Francisco International', cityName: 'San Francisco', countryName: 'United States', lat: 37.6213, lng: -122.3790 },
  { iataCode: 'YYZ', name: 'Toronto Pearson International', cityName: 'Toronto', countryName: 'Canada', lat: 43.6777, lng: -79.6248 },
  { iataCode: 'YVR', name: 'Vancouver International Airport', cityName: 'Vancouver', countryName: 'Canada', lat: 49.1939, lng: -123.1844 },

  // Asia
  { iataCode: 'DXB', name: 'Dubai International Airport', cityName: 'Dubai', countryName: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  { iataCode: 'NRT', name: 'Narita International Airport', cityName: 'Tokyo', countryName: 'Japan', lat: 35.7647, lng: 140.3864 },
  { iataCode: 'SIN', name: 'Singapore Changi Airport', cityName: 'Singapore', countryName: 'Singapore', lat: 1.3644, lng: 103.9915 },
]

const MOCK_AIRLINES = [
  'Air France', 'Lufthansa', 'British Airways', 'KLM', 'Ryanair',
  'EasyJet', 'Iberia', 'Alitalia', 'Swiss', 'Austrian Airlines',
  'Turkish Airlines', 'Emirates', 'Qatar Airways'
]

// Mock flight generator function
export function generateMockFlights(criteria: SearchCriteria): Flight[] {
  if (!criteria.origin || !criteria.destination) {
    return []
  }

  const flights: Flight[] = []
  const numFlights = Math.floor(Math.random() * 3) + 4 // 4-6 flights

  for (let i = 0; i < numFlights; i++) {
    const airline = MOCK_AIRLINES[Math.floor(Math.random() * MOCK_AIRLINES.length)]
    const stops = Math.random() > 0.6 ? 0 : (Math.random() > 0.5 ? 1 : 2)

    // Generate random departure times
    const depHour = 6 + Math.floor(Math.random() * 16) // 6:00 - 22:00
    const depMin = Math.floor(Math.random() * 4) * 15 // 00, 15, 30, 45

    // Generate duration (2-8 hours)
    const durationHours = 2 + Math.floor(Math.random() * 6)
    const durationMins = Math.floor(Math.random() * 4) * 15

    // Calculate prices for ALL cabins
    let economyPrice = 150 + Math.floor(Math.random() * 400)
    if (stops === 0) economyPrice += 50

    const cabinPrices = {
      economy: Math.round(economyPrice),
      business: Math.round(economyPrice * 2.5),
      first: Math.round(economyPrice * 4)
    }

    // Use the selected class price as the main price
    const selectedClassPrice = cabinPrices[criteria.travelClass as 'economy' | 'business' | 'first'] || cabinPrices.economy

    // Create ISO datetime for departure
    const departureDateTime = `${criteria.departureDate}T${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}:00`

    // Calculate arrival datetime
    const depDate = new Date(departureDateTime)
    depDate.setHours(depDate.getHours() + durationHours)
    depDate.setMinutes(depDate.getMinutes() + durationMins)
    const arrivalDateTime = depDate.toISOString().slice(0, 19)

    // ISO duration format
    const isoDuration = `PT${durationHours}H${durationMins}M`

    // Create outbound itinerary
    const outboundSegments = [{
      departureAirport: criteria.origin.iataCode,
      departureCity: criteria.origin.cityName,
      arrivalAirport: criteria.destination.iataCode,
      arrivalCity: criteria.destination.cityName,
      departureTime: departureDateTime,
      arrivalTime: arrivalDateTime,
      flightNumber: `${Math.floor(Math.random() * 9000) + 1000}`,
      airlineCode: airline.substring(0, 2).toUpperCase(),
      airlineName: airline,
      duration: isoDuration,
      sequenceNumber: 0,
      aircraftCode: ['A320', 'A350', 'B737', 'B787'][Math.floor(Math.random() * 4)],
      availableSeats: Math.floor(Math.random() * 20) + 3  // Per-segment seat availability
    }]

    const itineraries = [{
      duration: isoDuration,
      segments: outboundSegments,
      numberOfStops: stops
    }]

    // Add return itinerary for round-trips
    if (criteria.tripType === 'roundtrip' && criteria.returnDate) {
      const returnDepHour = 6 + Math.floor(Math.random() * 16)
      const returnDepMin = Math.floor(Math.random() * 4) * 15
      const returnDepartureDateTime = `${criteria.returnDate}T${String(returnDepHour).padStart(2, '0')}:${String(returnDepMin).padStart(2, '0')}:00`

      const returnDepDate = new Date(returnDepartureDateTime)
      returnDepDate.setHours(returnDepDate.getHours() + durationHours)
      returnDepDate.setMinutes(returnDepDate.getMinutes() + durationMins)
      const returnArrivalDateTime = returnDepDate.toISOString().slice(0, 19)

      itineraries.push({
        duration: isoDuration,
        segments: [{
          departureAirport: criteria.destination.iataCode,
          departureCity: criteria.destination.cityName,
          arrivalAirport: criteria.origin.iataCode,
          arrivalCity: criteria.origin.cityName,
          departureTime: returnDepartureDateTime,
          arrivalTime: returnArrivalDateTime,
          flightNumber: `${Math.floor(Math.random() * 9000) + 1000}`,
          airlineCode: airline.substring(0, 2).toUpperCase(),
          airlineName: airline,
          duration: isoDuration,
          sequenceNumber: 0,
          aircraftCode: ['320', '321', '737', '738', '777', '787'][Math.floor(Math.random() * 6)],
          availableSeats: Math.floor(Math.random() * 20) + 3  // Per-segment seat availability
        }],
        numberOfStops: stops
      })
    }

    flights.push({
      id: `FL${1000 + i}`,
      price: selectedClassPrice,
      currency: 'EUR',
      seats: Math.floor(Math.random() * 20) + 3,
      itineraries,
      airlines: [airline],
      validatingAirline: airline,
      totalDuration: isoDuration,
      totalStops: stops,
      cabinPrices
    })
  }

  // Sort by price (ascending)
  return flights.sort((a, b) => a.price - b.price)
}
