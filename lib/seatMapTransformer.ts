import type { SeatMapResponse, UISeat } from '@/types/amadeus'

/**
 * Transform Amadeus SeatMap API response to UI-friendly seat grid
 * Handles: multiple decks, irregular layouts, availability mapping
 */
export function transformSeatMapToUI(
  seatMapResponse: SeatMapResponse,
  cabinClass: string
): UISeat[] {
  if (!seatMapResponse?.data || seatMapResponse.data.length === 0) {
    return []
  }

  const uiSeats: UISeat[] = []

  for (const seatMapData of seatMapResponse.data) {
    for (const deck of seatMapData.decks || []) {
      for (const seat of deck.seats) {
        // Skip seats not matching requested cabin
        if (cabinClass && seat.cabin.toLowerCase() !== cabinClass.toLowerCase()) {
          continue
        }

        // Parse seat number (e.g., "12B" → row: 12, column: "B")
        const match = seat.number.match(/^(\d+)([A-K])$/)
        if (!match) continue

        const row = parseInt(match[1], 10)
        const column = match[2]

        // Extract pricing and availability from first traveler
        const firstTraveler = seat.travelerPricing?.[0]
        const availability = firstTraveler?.seatAvailabilityStatus || 'BLOCKED'
        const price = firstTraveler?.price
          ? parseFloat(firstTraveler.price.total)
          : 0

        // Extract seat features from characteristicsCodes
        const codes = seat.characteristicsCodes || []
        const isWindow = codes.includes('W')
        const isAisle = codes.includes('A')
        const isExitRow = codes.some(c => c.startsWith('1'))  // 1A, 1B = exit row
        const hasRestrictedRecline = codes.includes('RS')

        uiSeats.push({
          id: seat.number,
          row,
          column,
          isBooked: availability === 'OCCUPIED',
          isAvailable: availability === 'AVAILABLE',
          price,
          currency: firstTraveler?.price?.currency || 'EUR',
          cabin: seat.cabin,
          isWindow,
          isAisle,
          isExitRow,
          hasRestrictedRecline,
        })
      }
    }
  }

  return uiSeats
}

/**
 * Get grid dimensions from seat data
 */
export function getSeatGridDimensions(seats: UISeat[]): {
  rows: number
  columns: string[]
  aislePositions: number[]
} {
  if (seats.length === 0) {
    return { rows: 0, columns: [], aislePositions: [] }
  }

  const maxRow = Math.max(...seats.map(s => s.row))
  const uniqueColumns = Array.from(new Set(seats.map(s => s.column))).sort()

  // Detect aisles (gaps in alphabetical column sequence)
  const aisles: number[] = []
  for (let i = 1; i < uniqueColumns.length; i++) {
    const prevCode = uniqueColumns[i - 1].charCodeAt(uniqueColumns[i - 1].length - 1)
    const currCode = uniqueColumns[i].charCodeAt(0)

    if (currCode - prevCode > 1) {  // Gap detected (B→D means aisle after B)
      aisles.push(i)
    }
  }

  return { rows: maxRow, columns: uniqueColumns, aislePositions: aisles }
}

/**
 * Validate rawOffer has required structure
 */
export function validateFlightOffer(rawOffer: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!rawOffer) {
    return { isValid: false, errors: ['Flight offer is null'] }
  }

  if (!rawOffer.itineraries || !Array.isArray(rawOffer.itineraries)) {
    errors.push('Missing itineraries')
  }

  if (!rawOffer.travelerPricings || !Array.isArray(rawOffer.travelerPricings)) {
    errors.push('Missing travelerPricings')
  }

  return { isValid: errors.length === 0, errors }
}
