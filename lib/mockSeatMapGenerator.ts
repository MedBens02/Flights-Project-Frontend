import type { Flight } from '@/types/flight'
import type { TravelClass } from '@/types/search'
import type { UISeat } from '@/types/amadeus'

interface AircraftConfig {
  name: string
  columns: string[]  // e.g., ['A', 'B', 'C', 'D', 'E', 'F']
  aislePositions: number[]  // where aisles appear (after column index)
  rowsByClass: {
    economy: { startRow: number, endRow: number, price: number }
    premium_economy: { startRow: number, endRow: number, price: number }
    business: { startRow: number, endRow: number, price: number }
    first: { startRow: number, endRow: number, price: number }
  }
}

const AIRCRAFT_TYPES: AircraftConfig[] = [
  // Narrow-body (short haul)
  {
    name: 'Airbus A320',
    columns: ['A', 'B', 'C', 'D', 'E', 'F'],  // 3-3 configuration
    aislePositions: [3],  // aisle after column C
    rowsByClass: {
      economy: { startRow: 1, endRow: 25, price: 0 },
      premium_economy: { startRow: 1, endRow: 0, price: 0 },  // none
      business: { startRow: 1, endRow: 0, price: 0 },  // none
      first: { startRow: 1, endRow: 0, price: 0 },  // none
    },
  },

  // Wide-body (long haul)
  {
    name: 'Airbus A350',
    columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],  // 3-4-3
    aislePositions: [3, 7],  // aisles after C and G
    rowsByClass: {
      first: { startRow: 1, endRow: 4, price: 300 },
      business: { startRow: 1, endRow: 10, price: 150 },
      premium_economy: { startRow: 1, endRow: 15, price: 75 },
      economy: { startRow: 1, endRow: 30, price: 0 },
    },
  },

  {
    name: 'Boeing 787 Dreamliner',
    columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],  // 3-3-3
    aislePositions: [3, 6],
    rowsByClass: {
      business: { startRow: 1, endRow: 8, price: 150 },
      premium_economy: { startRow: 1, endRow: 12, price: 75 },
      economy: { startRow: 1, endRow: 28, price: 0 },
      first: { startRow: 1, endRow: 0, price: 0 },  // none
    },
  },

  {
    name: 'Boeing 737',
    columns: ['A', 'B', 'C', 'D', 'E', 'F'],  // 3-3
    aislePositions: [3],
    rowsByClass: {
      economy: { startRow: 1, endRow: 28, price: 0 },
      premium_economy: { startRow: 1, endRow: 0, price: 0 },
      business: { startRow: 1, endRow: 0, price: 0 },
      first: { startRow: 1, endRow: 0, price: 0 },
    },
  },
]

/**
 * Deterministically select aircraft type based on flight ID
 */
function selectAircraftForFlight(flight: Flight): AircraftConfig {
  const flightId = parseInt(flight.id) || 1

  // Deterministic selection based on flight ID
  const index = flightId % AIRCRAFT_TYPES.length
  return AIRCRAFT_TYPES[index]
}

/**
 * Deterministic hash function for seat position
 * Returns a value between 0.00 and 1.00
 */
function hashSeatPosition(flightId: string, row: number, column: string): number {
  const str = `${flightId}-${row}-${column}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash  // Convert to 32-bit integer
  }
  return Math.abs(hash % 100) / 100  // Return 0.00 to 1.00
}

/**
 * Generate realistic mock seat map based on flight and cabin class
 * Matches the number of booked seats to flight.seats available count
 * Returns seats with aircraft configuration (columns and aisle positions)
 */
export function generateMockSeatMap(
  flight: Flight,
  cabinClass: TravelClass
): {
  seats: UISeat[]
  columns: string[]
  aislePositions: number[]
} {
  const aircraft = selectAircraftForFlight(flight)
  const classConfig = aircraft.rowsByClass[cabinClass]

  // Skip if this aircraft doesn't have this cabin class
  if (!classConfig || classConfig.endRow === 0) {
    return { seats: [], columns: [], aislePositions: [] }
  }

  const totalSeats = (classConfig.endRow - classConfig.startRow + 1) * aircraft.columns.length
  const availableSeats = flight.seats  // from API response
  const bookedCount = Math.max(0, Math.min(totalSeats, totalSeats - availableSeats))

  // Calculate base seat price proportional to flight cost
  // First class: 0 (all included), Others: percentage of flight price
  const flightPrice = flight.price
  let baseSeatPrice = 0

  if (cabinClass === 'first') {
    // First class: all seats included, no charge
    baseSeatPrice = 0
  } else if (cabinClass === 'business') {
    // Business: 1.5% of flight price
    baseSeatPrice = Math.round(flightPrice * 0.015)
  } else if (cabinClass === 'premium_economy') {
    // Premium Economy: 2% of flight price
    baseSeatPrice = Math.round(flightPrice * 0.02)
  } else {
    // Economy: 2.5% of flight price
    baseSeatPrice = Math.round(flightPrice * 0.025)
  }

  // First pass: Create all seats with their properties and hash values
  interface SeatWithHash extends UISeat {
    hash: number
  }

  const seatsWithHashes: SeatWithHash[] = []

  for (let row = classConfig.startRow; row <= classConfig.endRow; row++) {
    for (let colIndex = 0; colIndex < aircraft.columns.length; colIndex++) {
      const column = aircraft.columns[colIndex]
      const seatId = `${row}${column}`

      // Deterministic hash based on flight ID + seat position
      const seatHash = hashSeatPosition(flight.id, row, column)

      // Determine seat characteristics
      const isWindow = colIndex === 0 || colIndex === aircraft.columns.length - 1
      const isAisle = aircraft.aislePositions.some(pos =>
        colIndex === pos - 1 || colIndex === pos
      )
      // Exit rows should be positioned in the middle-back of each cabin section
      const sectionLength = classConfig.endRow - classConfig.startRow + 1
      const exitRowPosition = Math.floor(sectionLength * 0.4)  // 40% through the section
      const isExitRow = row === classConfig.startRow + exitRowPosition

      // Pricing - proportional to flight cost
      let price = baseSeatPrice

      if (cabinClass !== 'first') {
        // Add premiums for special seats (not for first class)
        if (isExitRow) {
          // Exit rows: add 50% premium
          price = Math.round(price * 1.5)
        } else if (isWindow) {
          // Window seats: add 20% premium
          price = Math.round(price * 1.2)
        } else if (isAisle) {
          // Aisle seats: add 10% premium
          price = Math.round(price * 1.1)
        }
      }

      seatsWithHashes.push({
        id: seatId,
        row,
        column,
        isBooked: false, // Will be set in second pass
        isAvailable: true, // Will be set in second pass
        price,
        currency: 'EUR',
        cabin: cabinClass.toUpperCase(),
        isWindow,
        isAisle,
        isExitRow,
        hasRestrictedRecline: false,
        hash: seatHash,
      })
    }
  }

  // Second pass: Sort by hash and mark exactly bookedCount seats as booked
  seatsWithHashes.sort((a, b) => a.hash - b.hash)

  for (let i = 0; i < seatsWithHashes.length; i++) {
    if (i < bookedCount) {
      seatsWithHashes[i].isBooked = true
      seatsWithHashes[i].isAvailable = false
    }
  }

  // Remove hash property and create final seats array
  const seats: UISeat[] = seatsWithHashes.map(({ hash, ...seat }) => seat)

  return {
    seats,
    columns: aircraft.columns,
    aislePositions: aircraft.aislePositions,
  }
}
