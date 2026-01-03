# 🚀 Amadeus SeatMap & Upsell API Integration

## Overview

Replace current mock seat generation and hardcoded luggage prices with real data from Amadeus APIs:
1. **SeatMap Display API (v1.9)** - Real seat availability, pricing, and amenities
2. **Branded Fares Upsell API (v1.0)** - Dynamic baggage allowances and cabin upgrades

**Current State:**
- ✅ Backend running at `https://localhost:7001/api`
- ✅ Flight search returns `{ flights: Flight[], rawOffers: Record<string, any> }`
- ✅ `rawOffer` field stored but unused (contains full Amadeus offer data)
- ❌ Seats generated using deterministic mock algorithm (seededRandom)
- ❌ Luggage options hardcoded with fixed prices

**Target State:**
- ✅ SeatMap API called when modal opens → real seat data
- ✅ Upsell API called when modal opens → real luggage pricing
- ✅ Graceful fallback to mock data if APIs fail
- ✅ Loading states and error handling

---

## Architecture

**Data Flow:**
```
Flight Selection → Modal Opens → Parallel API Calls:
  1. POST /api/seatmaps (using rawOffer) → Real seat map
  2. POST /api/upsells (using rawOffer) → Baggage pricing

API Responses → Transform to UI format → Render seats/luggage
```

**Key Components:**
- `types/amadeus.ts` - TypeScript interfaces for API request/response
- `lib/api.ts` - API client functions (getSeatMap, getFlightUpsells)
- `lib/seatMapTransformer.ts` - Transform SeatMap response to UI grid
- `lib/upsellTransformer.ts` - Extract luggage options from Upsell response
- `hooks/useSeatMap.ts` - React Query hook with 5-min cache
- `hooks/useFlightUpsells.ts` - React Query hook with 10-min cache
- `components/flight-leg-selection-modal.tsx` - Integration point (MAJOR REFACTOR)

---

## Implementation Plan

### Phase 1: Type Definitions (2 hours)

#### 1.1 Create Amadeus API Types

**File:** `types/amadeus.ts` (NEW FILE)

```typescript
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
}

export interface UILuggageOption {
  id: string
  label: string
  weight: string
  price: number
  included: boolean
}
```

#### 1.2 Update Booking Types

**File:** `types/booking.ts` (UPDATE)

Add to `FlightLegSelection` interface:
```typescript
export interface FlightLegSelection {
  flight: Flight | null
  rawOffer: any
  selectedSeats: string[]
  selectedLuggage: string[]

  // NEW: Cache transformed API data
  seatMapData?: SeatMapData[]
  upsellData?: UpsellFlightOffer[]
}
```

---

### Phase 2: API Client Functions (1 hour)

**File:** `lib/api.ts` (ADD after line 114)

```typescript
import type { SeatMapRequest, SeatMapResponse, UpsellRequest, UpsellResponse } from '@/types/amadeus'

/**
 * Get seat map for a flight offer
 * Amadeus API: POST /v1/shopping/seatmaps
 */
export async function getSeatMap(flightOffer: any): Promise<SeatMapResponse> {
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
  if (!flightOffer) {
    throw new Error('Flight offer is required for upsell lookup')
  }

  const requestBody: UpsellRequest = {
    data: {
      type: 'flight-offers-upselling',
      flightOffers: [flightOffer]
    }
  }

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
```

**Backend Requirements:**
- Backend must implement `POST /api/seatmaps` → proxy to Amadeus `POST /v1/shopping/seatmaps`
- Backend must implement `POST /api/upsells` → proxy to Amadeus `POST /v1/shopping/flight-offers/upselling`
- Accept full flight offer structure (don't filter fields)
- Pass through entire Amadeus response
- Handle OAuth 2.0 authentication for Amadeus
- Consider caching responses (5-10 minutes)

---

### Phase 3: Data Transformation Utilities (4 hours)

#### 3.1 SeatMap Transformer

**File:** `lib/seatMapTransformer.ts` (NEW)

```typescript
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

        uiSeats.push({
          id: seat.number,
          row,
          column,
          isBooked: availability === 'OCCUPIED',
          isAvailable: availability === 'AVAILABLE',
          price,
          currency: firstTraveler?.price?.currency || 'EUR',
          cabin: seat.cabin,
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
} {
  if (seats.length === 0) {
    return { rows: 0, columns: [] }
  }

  const maxRow = Math.max(...seats.map(s => s.row))
  const uniqueColumns = Array.from(new Set(seats.map(s => s.column))).sort()

  return { rows: maxRow, columns: uniqueColumns }
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
```

#### 3.2 Upsell Transformer

**File:** `lib/upsellTransformer.ts` (NEW)

```typescript
import type { UpsellResponse, UILuggageOption } from '@/types/amadeus'

/**
 * Transform Amadeus Upsell API response to UI-friendly luggage options
 */
export function transformUpsellToLuggage(
  upsellResponse: UpsellResponse,
  currentCabinClass: string
): UILuggageOption[] {
  if (!upsellResponse?.data || upsellResponse.data.length === 0) {
    return []
  }

  const options: UILuggageOption[] = []

  // Find offer matching current cabin (or use first offer)
  const relevantOffer = upsellResponse.data.find(offer => {
    const firstTraveler = offer.travelerPricings?.[0]
    const firstSegment = firstTraveler?.fareDetailsBySegment?.[0]
    return firstSegment?.cabin.toLowerCase() === currentCabinClass.toLowerCase()
  }) || upsellResponse.data[0]

  if (!relevantOffer) return []

  // Extract included baggage
  const firstTraveler = relevantOffer.travelerPricings?.[0]
  const firstSegment = firstTraveler?.fareDetailsBySegment?.[0]
  const includedBags = firstSegment?.includedCheckedBags

  // Standard included luggage
  if (includedBags && includedBags.quantity && includedBags.quantity > 0) {
    options.push({
      id: 'standard',
      label: 'Standard Luggage',
      weight: `${includedBags.weight || 23}${includedBags.weightUnit || 'KG'}`,
      price: 0,
      included: true,
    })
  }

  // Cabin baggage (always free)
  options.push({
    id: 'cabin',
    label: 'Cabin Baggage',
    weight: '7kg',
    price: 0,
    included: true,
  })

  // Extract additional baggage pricing
  const additionalServices = relevantOffer.price?.additionalServices || []
  const baggageService = additionalServices.find(s => s.type === 'CHECKED_BAGS')

  if (baggageService) {
    const extraBagPrice = parseFloat(baggageService.amount)

    options.push({
      id: 'extra1',
      label: '1st Extra Bag',
      weight: '23kg',
      price: extraBagPrice,
      included: false,
    })

    options.push({
      id: 'extra2',
      label: '2nd Extra Bag',
      weight: '23kg',
      price: extraBagPrice * 1.5,
      included: false,
    })
  }

  return options
}
```

---

### Phase 4: React Query Hooks (1 hour)

#### 4.1 SeatMap Hook

**File:** `hooks/useSeatMap.ts` (NEW)

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSeatMap } from '@/lib/api'
import type { SeatMapResponse } from '@/types/amadeus'

export function useSeatMap(flightOffer: any | null, enabled: boolean = true) {
  return useQuery<SeatMapResponse>({
    queryKey: ['seatmap', flightOffer?.id],
    queryFn: () => getSeatMap(flightOffer),
    enabled: enabled && !!flightOffer,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
```

#### 4.2 Upsell Hook

**File:** `hooks/useFlightUpsells.ts` (NEW)

```typescript
import { useQuery } from '@tanstack/react-query'
import { getFlightUpsells } from '@/lib/api'
import type { UpsellResponse } from '@/types/amadeus'

export function useFlightUpsells(flightOffer: any | null, enabled: boolean = true) {
  return useQuery<UpsellResponse>({
    queryKey: ['upsells', flightOffer?.id],
    queryFn: () => getFlightUpsells(flightOffer),
    enabled: enabled && !!flightOffer,
    staleTime: 10 * 60 * 1000,  // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
```

---

### Phase 5: Component Integration (6 hours)

**File:** `components/flight-leg-selection-modal.tsx` (MAJOR REFACTOR)

#### 5.1 Add Imports (after line 7)

```typescript
import { useSeatMap } from "@/hooks/useSeatMap"
import { useFlightUpsells } from "@/hooks/useFlightUpsells"
import { transformSeatMapToUI, getSeatGridDimensions, validateFlightOffer } from "@/lib/seatMapTransformer"
import { transformUpsellToLuggage } from "@/lib/upsellTransformer"
import type { UISeat, UILuggageOption } from "@/types/amadeus"
```

#### 5.2 Remove Hardcoded Constants (DELETE lines 56-68)

```typescript
// DELETE:
// const SEAT_CLASSES = { economy: {...}, ... }
// const LUGGAGE_OPTIONS = [...]
```

#### 5.3 Add API Query Hooks (after line 81)

```typescript
  // Validate rawOffer before API calls
  const offerValidation = useMemo(() => {
    return validateFlightOffer(rawOffer)
  }, [rawOffer])

  const shouldFetchAPIs = offerValidation.isValid

  // Fetch seat map from Amadeus API
  const {
    data: seatMapData,
    isLoading: isSeatMapLoading,
    error: seatMapError,
  } = useSeatMap(rawOffer, shouldFetchAPIs)

  // Fetch upsell options from Amadeus API
  const {
    data: upsellData,
    isLoading: isUpsellLoading,
    error: upsellError,
  } = useFlightUpsells(rawOffer, shouldFetchAPIs)

  // Transform API data to UI format
  const transformedSeats: UISeat[] = useMemo(() => {
    if (!seatMapData) return []
    return transformSeatMapToUI(seatMapData, cabinClass)
  }, [seatMapData, cabinClass])

  const transformedLuggage: UILuggageOption[] = useMemo(() => {
    if (!upsellData) return []
    return transformUpsellToLuggage(upsellData, cabinClass)
  }, [upsellData, cabinClass])

  const { rows: seatRows, columns: seatColumns } = useMemo(() => {
    return getSeatGridDimensions(transformedSeats)
  }, [transformedSeats])
```

#### 5.4 Replace Seat Generation Logic (lines 99-126)

```typescript
  // Build seats from API data (with fallback to mock)
  const seats = useMemo(() => {
    if (transformedSeats.length > 0) {
      // Use real seat data from API
      return transformedSeats.map(seat => ({
        id: seat.id,
        isBooked: seat.isBooked || !seat.isAvailable,
        isSelected: false,
        price: seat.price,
        currency: seat.currency,
      }))
    }

    // FALLBACK: Mock data if API fails
    const mockConfig = {
      economy: { price: 0, rows: 8, seatsPerRow: 6 },
      premium_economy: { price: 75, rows: 6, seatsPerRow: 6 },
      business: { price: 150, rows: 4, seatsPerRow: 6 },
      first: { price: 300, rows: 2, seatsPerRow: 4 },
    }

    const config = mockConfig[cabinClass]
    const result = []
    const totalSeats = config.rows * config.seatsPerRow
    const availableSeats = flight.seats
    const bookedCount = Math.max(0, totalSeats - availableSeats)
    const bookedProb = bookedCount / totalSeats

    for (let row = 1; row <= config.rows; row++) {
      for (let col = 0; col < config.seatsPerRow; col++) {
        const seatId = `${String.fromCharCode(65 + col)}${row}`
        const seatIndex = (row - 1) * config.seatsPerRow + col
        const randomValue = seededRandom(flight.id, seatIndex)

        result.push({
          id: seatId,
          isBooked: randomValue < bookedProb,
          isSelected: false,
          price: config.price,
          currency: 'EUR',
        })
      }
    }
    return result
  }, [transformedSeats, flight.id, cabinClass, flight.seats])

  // Luggage options (API data or fallback)
  const luggageOptions = useMemo(() => {
    if (transformedLuggage.length > 0) {
      return transformedLuggage
    }

    // FALLBACK: Hardcoded mock
    return [
      { id: "standard", label: "Standard Luggage", weight: "23kg", price: 0, included: true },
      { id: "extra1", label: "1st Extra Bag", weight: "23kg", price: 45, included: false },
      { id: "extra2", label: "2nd Extra Bag", weight: "23kg", price: 65, included: false },
      { id: "cabin", label: "Cabin Baggage", weight: "7kg", price: 0, included: true },
    ]
  }, [transformedLuggage])
```

#### 5.5 Add Loading State (before return at line 154)

```typescript
  // Show loading state
  if (isSeatMapLoading || isUpsellLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-12 text-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-foreground mb-2">Loading Seat Map...</h3>
          <p className="text-foreground/60">Fetching available seats and luggage options</p>
        </div>
      </div>
    )
  }

  const hasApiError = seatMapError || upsellError
```

#### 5.6 Add Error Banner (inside modal after header, around line 187)

```typescript
        {/* API Error Warning */}
        {hasApiError && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Unable to load real-time seat data. Showing estimated availability.
                </p>
              </div>
            </div>
          </div>
        )}
```

#### 5.7 Update Seat Grid Rendering (line 239)

```typescript
                  <div className="flex justify-center">
                    <div
                      className="inline-grid gap-2"
                      style={{
                        gridTemplateColumns: seatColumns.length > 0
                          ? `repeat(${seatColumns.length}, 2.5rem)`
                          : `repeat(6, 2.5rem)`
                      }}
                    >
```

#### 5.8 Update Luggage Rendering (line 303)

```typescript
                <div className="space-y-3">
                  {luggageOptions.map((luggage) => (
```

---

### Phase 6: Testing & Refinement (4 hours)

#### 6.1 Manual Testing Checklist

- [ ] Search flights → verify `rawOffer` populated in network tab
- [ ] Select outbound → modal opens
- [ ] Check Network tab → SeatMap API called
- [ ] Check Network tab → Upsell API called
- [ ] Seat grid renders with real data
- [ ] Luggage shows real prices
- [ ] Select seats/luggage → confirm → data saved
- [ ] Test API failure (stop backend) → shows mock data
- [ ] Test invalid rawOffer (set to null) → shows mock data
- [ ] Test different cabin classes (economy, business, first)
- [ ] Test round-trip flow (outbound + return)

#### 6.2 Edge Cases

1. **Multiple Decks:** Transformer flattens all decks to single grid
2. **No SeatMap Data:** Returns empty array → fallback to mock
3. **Multi-Segment Flights:** Show first segment only (v1), add message
4. **Missing Pricing:** Default to 0 (free selection)
5. **Currency Mismatch:** Display in native currency (no conversion)
6. **Large Aircraft (500+ seats):** Render all (add virtualization in v2 if slow)

---

## Implementation Order

### Day 1: Foundation (3 hours)
1. Create `types/amadeus.ts` with all interfaces
2. Update `types/booking.ts`
3. Run `npm run build` to verify types

### Day 2: Backend + API Client (5 hours)
4. **Backend team:** Implement `POST /api/seatmaps` and `POST /api/upsells` proxy endpoints
5. Add `getSeatMap()` and `getFlightUpsells()` to `lib/api.ts`
6. Test with Postman using real flight offer

### Day 3: Transformers (4 hours)
7. Create `lib/seatMapTransformer.ts`
8. Create `lib/upsellTransformer.ts`
9. Test transformers with sample API responses

### Day 4: Hooks (1 hour)
10. Create `hooks/useSeatMap.ts`
11. Create `hooks/useFlightUpsells.ts`

### Day 5: Component Integration (6 hours)
12. Update `components/flight-leg-selection-modal.tsx`
13. Test end-to-end flow
14. Fix any issues

### Day 6: Testing & Polish (4 hours)
15. Manual testing all scenarios
16. Performance testing
17. Error scenario testing
18. Documentation

**Total: ~6 days (23 hours)**

---

## Error Handling Strategy

### API Failures
- **SeatMap API fails:** Use deterministic mock generation (existing algorithm)
- **Upsell API fails:** Use hardcoded luggage options
- **Both fail:** Full fallback to current behavior
- **Partial success:** Mix real + mock data

### Validation Failures
- **No rawOffer:** Skip API calls, use mock immediately
- **Invalid rawOffer structure:** Log error, use mock
- **Empty API response:** Treat as failure, use mock

### User Experience
- **Loading:** Show spinner during API calls (2-5 seconds typical)
- **Error Banner:** Yellow warning if API failed (not critical, show message)
- **Retry:** React Query handles 2 retries automatically
- **Cache:** 5-10 min cache prevents redundant calls

---

## Rollback Plan

### Quick Rollback (5 minutes)
1. Revert `components/flight-leg-selection-modal.tsx` to previous commit
2. Deploy

### Feature Flag (Gradual Rollout)
Add to `.env.local`:
```
NEXT_PUBLIC_ENABLE_REAL_SEATMAP=false  # Toggle to enable/disable
```

Use in component:
```typescript
const USE_REAL_SEATMAP = process.env.NEXT_PUBLIC_ENABLE_REAL_SEATMAP === 'true'
const shouldFetchAPIs = USE_REAL_SEATMAP && offerValidation.isValid
```

---
