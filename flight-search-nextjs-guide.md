# Flight Search Engine - Project Guide (Next.js + ASP.NET Core)

## Project Overview

Build a **Flight Search Engine** web application using **Next.js React** frontend with **ASP.NET Core Web API** backend. The application allows users to search for flights using the **Amadeus API**, display results with sorting and filtering, and provide a professional UX.

---

## Tech Stack

### Frontend (Next.js)
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS** for styling
- **React Query (TanStack Query)** for data fetching & caching
- **Lucide React** or **React Icons** for icons
- **date-fns** for date handling

### Backend (ASP.NET Core)
- **ASP.NET Core 8.0 Web API**
- **C#**
- **Amadeus Flight API**

### Architecture
- Frontend: Next.js with client components for interactivity
- Backend: Clean Architecture with Repository pattern
- Communication: REST API with JSON

---

## Functional Requirements

### 1. Search Form
| Field | Type | Details |
|-------|------|---------|
| Trip Type | Radio/Toggle | One-way / Round-trip |
| Departure City | Text + Autocomplete | Debounced API calls (300ms) |
| Arrival City | Text + Autocomplete | Same as departure |
| Departure Date | Date Picker | Cannot be in the past |
| Return Date | Date Picker | Only for round-trip, >= departure |
| Passengers | Dropdown/Modal | Adults, Children, Infants |
| Class Type | Select | Economy, Premium Economy, Business, First |

### 2. Results Display
- Card-based layout with flight details
- Airline logo, times, duration, stops, price
- Loading skeleton during fetch
- Empty state for no results

### 3. Sorting
- Price (Low/High)
- Duration (Shortest)
- Departure/Arrival Time

### 4. Filtering
- Stops: Direct, 1 stop, 2+ stops
- Departure/Arrival time ranges
- Airlines (multi-select)
- Price range slider

### 5. Modify Search
- Preserve form state
- Edit without losing data

---

## Project Structure

```
flight-search-engine/
├── backend/                              # ASP.NET Core API
│   ├── FlightSearch.API/
│   │   ├── Controllers/
│   │   │   ├── FlightsController.cs
│   │   │   └── AirportsController.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   ├── FlightSearch.Core/
│   │   ├── Interfaces/
│   │   │   ├── IFlightService.cs
│   │   │   └── IAirportService.cs
│   │   ├── Models/
│   │   │   ├── FlightOffer.cs
│   │   │   ├── Airport.cs
│   │   │   └── SearchCriteria.cs
│   │   └── DTOs/
│   │       ├── FlightSearchRequest.cs
│   │       └── FlightSearchResponse.cs
│   │
│   └── FlightSearch.Infrastructure/
│       └── Services/
│           ├── AmadeusFlightService.cs
│           ├── AmadeusAirportService.cs
│           └── AmadeusAuthService.cs
│
└── frontend/                             # Next.js App
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                  # Home/Search page
    │   │   └── globals.css
    │   │
    │   ├── components/
    │   │   ├── search/
    │   │   │   ├── SearchForm.tsx
    │   │   │   ├── TripTypeToggle.tsx
    │   │   │   ├── CityAutocomplete.tsx
    │   │   │   ├── DatePicker.tsx
    │   │   │   ├── PassengerSelect.tsx
    │   │   │   └── ClassSelect.tsx
    │   │   │
    │   │   ├── results/
    │   │   │   ├── FlightResults.tsx
    │   │   │   ├── FlightCard.tsx
    │   │   │   ├── SortOptions.tsx
    │   │   │   ├── FilterPanel.tsx
    │   │   │   └── FlightSkeleton.tsx
    │   │   │
    │   │   └── ui/                       # Reusable UI components
    │   │       ├── Button.tsx
    │   │       ├── Input.tsx
    │   │       ├── Select.tsx
    │   │       └── Slider.tsx
    │   │
    │   ├── hooks/
    │   │   ├── useFlightSearch.ts
    │   │   ├── useAirportSearch.ts
    │   │   └── useDebounce.ts
    │   │
    │   ├── lib/
    │   │   ├── api.ts                    # API client
    │   │   └── utils.ts
    │   │
    │   ├── types/
    │   │   ├── flight.ts
    │   │   ├── airport.ts
    │   │   └── search.ts
    │   │
    │   └── store/                        # State management (Zustand or Context)
    │       └── searchStore.ts
    │
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── next.config.js
```

---

## TypeScript Types (Frontend)

### types/search.ts
```typescript
export type TripType = 'one-way' | 'round-trip';

export type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface SearchCriteria {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  departureDate: Date;
  returnDate?: Date;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  travelClass: TravelClass;
}

export interface SearchFilters {
  stops: ('direct' | '1-stop' | '2+-stops')[];
  departureTimeRange: [number, number]; // [0-24, 0-24]
  arrivalTimeRange: [number, number];
  airlines: string[];
  priceRange: [number, number];
}

export type SortOption = 'price-asc' | 'price-desc' | 'duration' | 'departure' | 'arrival';
```

### types/airport.ts
```typescript
export interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
}
```

### types/flight.ts
```typescript
export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  itineraries: Itinerary[];
  numberOfStops: number;
  totalDuration: string; // ISO 8601 duration
  airlines: string[];
  validatingAirline: string;
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Segment {
  departureAirport: string;
  departureCity: string;
  arrivalAirport: string;
  arrivalCity: string;
  departureTime: string; // ISO datetime
  arrivalTime: string;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  duration: string;
}
```

---

## API Endpoints Design

### Backend API (ASP.NET Core)

```
GET  /api/airports/search?keyword={query}
     → Returns: Airport[]

POST /api/flights/search
     Body: SearchCriteria
     → Returns: FlightOffer[]
```

### C# DTOs

```csharp
// FlightSearchRequest.cs
public class FlightSearchRequest
{
    public string OriginLocationCode { get; set; }
    public string DestinationLocationCode { get; set; }
    public DateTime DepartureDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public int Adults { get; set; } = 1;
    public int Children { get; set; } = 0;
    public int Infants { get; set; } = 0;
    public string TravelClass { get; set; } = "ECONOMY";
}

// FlightSearchResponse.cs
public class FlightSearchResponse
{
    public List<FlightOfferDto> Flights { get; set; }
    public int TotalResults { get; set; }
}
```

---

## Key React Components

### CityAutocomplete.tsx
```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useAirportSearch } from '@/hooks/useAirportSearch';
import { Airport } from '@/types/airport';

interface Props {
  label: string;
  placeholder: string;
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
}

export function CityAutocomplete({ label, placeholder, value, onChange }: Props) {
  const [query, setQuery] = useState(value?.cityName || '');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { data: airports, isLoading } = useAirportSearch(debouncedQuery);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery(`${airport.cityName} (${airport.iataCode})`);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) onChange(null);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : airports?.length ? (
            airports.map((airport) => (
              <button
                key={airport.iataCode}
                onClick={() => handleSelect(airport)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between"
              >
                <span>{airport.cityName}, {airport.countryName}</span>
                <span className="text-gray-500 font-mono">{airport.iataCode}</span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### useDebounce.ts
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### useAirportSearch.ts (with React Query)
```typescript
import { useQuery } from '@tanstack/react-query';
import { searchAirports } from '@/lib/api';

export function useAirportSearch(keyword: string) {
  return useQuery({
    queryKey: ['airports', keyword],
    queryFn: () => searchAirports(keyword),
    enabled: keyword.length >= 2,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
```

### lib/api.ts
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7001/api';

export async function searchAirports(keyword: string) {
  const res = await fetch(`${API_BASE_URL}/airports/search?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error('Failed to fetch airports');
  return res.json();
}

export async function searchFlights(criteria: SearchCriteria) {
  const res = await fetch(`${API_BASE_URL}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originLocationCode: criteria.origin?.iataCode,
      destinationLocationCode: criteria.destination?.iataCode,
      departureDate: criteria.departureDate.toISOString().split('T')[0],
      returnDate: criteria.returnDate?.toISOString().split('T')[0],
      adults: criteria.passengers.adults,
      children: criteria.passengers.children,
      infants: criteria.passengers.infants,
      travelClass: criteria.travelClass,
    }),
  });
  if (!res.ok) throw new Error('Failed to search flights');
  return res.json();
}
```

---

## State Management (Zustand)

### store/searchStore.ts
```typescript
import { create } from 'zustand';
import { SearchCriteria, SearchFilters, SortOption } from '@/types/search';
import { FlightOffer } from '@/types/flight';

interface SearchState {
  criteria: SearchCriteria;
  results: FlightOffer[];
  filters: SearchFilters;
  sortBy: SortOption;
  isLoading: boolean;
  
  setCriteria: (criteria: Partial<SearchCriteria>) => void;
  setResults: (results: FlightOffer[]) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  setLoading: (loading: boolean) => void;
  resetFilters: () => void;
}

const defaultCriteria: SearchCriteria = {
  tripType: 'round-trip',
  origin: null,
  destination: null,
  departureDate: new Date(),
  returnDate: undefined,
  passengers: { adults: 1, children: 0, infants: 0 },
  travelClass: 'ECONOMY',
};

const defaultFilters: SearchFilters = {
  stops: [],
  departureTimeRange: [0, 24],
  arrivalTimeRange: [0, 24],
  airlines: [],
  priceRange: [0, 10000],
};

export const useSearchStore = create<SearchState>((set) => ({
  criteria: defaultCriteria,
  results: [],
  filters: defaultFilters,
  sortBy: 'price-asc',
  isLoading: false,

  setCriteria: (criteria) =>
    set((state) => ({ criteria: { ...state.criteria, ...criteria } })),
  setResults: (results) => set({ results }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSortBy: (sortBy) => set({ sortBy }),
  setLoading: (isLoading) => set({ isLoading }),
  resetFilters: () => set({ filters: defaultFilters }),
}));
```

---

## Sorting & Filtering Logic

### utils/flightUtils.ts
```typescript
import { FlightOffer } from '@/types/flight';
import { SearchFilters, SortOption } from '@/types/search';

export function sortFlights(flights: FlightOffer[], sortBy: SortOption): FlightOffer[] {
  return [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'duration':
        return parseDuration(a.totalDuration) - parseDuration(b.totalDuration);
      case 'departure':
        return new Date(a.itineraries[0].segments[0].departureTime).getTime() -
               new Date(b.itineraries[0].segments[0].departureTime).getTime();
      case 'arrival':
        const aLastSeg = a.itineraries[0].segments.at(-1)!;
        const bLastSeg = b.itineraries[0].segments.at(-1)!;
        return new Date(aLastSeg.arrivalTime).getTime() -
               new Date(bLastSeg.arrivalTime).getTime();
      default:
        return 0;
    }
  });
}

export function filterFlights(flights: FlightOffer[], filters: SearchFilters): FlightOffer[] {
  return flights.filter((flight) => {
    // Filter by stops
    if (filters.stops.length > 0) {
      const stops = flight.numberOfStops;
      const matchesStops = filters.stops.some((filter) => {
        if (filter === 'direct') return stops === 0;
        if (filter === '1-stop') return stops === 1;
        if (filter === '2+-stops') return stops >= 2;
        return true;
      });
      if (!matchesStops) return false;
    }

    // Filter by price
    if (flight.price < filters.priceRange[0] || flight.price > filters.priceRange[1]) {
      return false;
    }

    // Filter by departure time
    const depHour = new Date(flight.itineraries[0].segments[0].departureTime).getHours();
    if (depHour < filters.departureTimeRange[0] || depHour > filters.departureTimeRange[1]) {
      return false;
    }

    // Filter by airlines
    if (filters.airlines.length > 0) {
      const hasAirline = flight.airlines.some((a) => filters.airlines.includes(a));
      if (!hasAirline) return false;
    }

    return true;
  });
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (PT2H30M)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}
```

---

## ASP.NET Core Backend Setup

### Program.cs
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register services
builder.Services.AddHttpClient<IAmadeusAuthService, AmadeusAuthService>();
builder.Services.AddHttpClient<IFlightService, AmadeusFlightService>();
builder.Services.AddHttpClient<IAirportService, AmadeusAirportService>();
builder.Services.AddMemoryCache(); // For token caching

builder.Services.Configure<AmadeusSettings>(
    builder.Configuration.GetSection("Amadeus"));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("NextJs");
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### appsettings.json
```json
{
  "Amadeus": {
    "BaseUrl": "https://test.api.amadeus.com",
    "ClientId": "YOUR_API_KEY",
    "ClientSecret": "YOUR_API_SECRET"
  },
  "AllowedHosts": "*"
}
```

---

## Implementation Phases

### Phase 1: Project Setup (Day 1)
1. Create ASP.NET Core solution with Clean Architecture
2. Create Next.js app with TypeScript + Tailwind
3. Set up CORS between frontend and backend
4. Install dependencies (React Query, Zustand, date-fns, etc.)

### Phase 2: Amadeus Integration (Day 1-2)
1. Implement OAuth2 token service with caching
2. Create airport search endpoint
3. Create flight search endpoint
4. Test with Postman/Thunder Client

### Phase 3: Search Form (Day 2-3)
1. Build CityAutocomplete component
2. Build DatePicker component
3. Build PassengerSelect component
4. Build TripTypeToggle and ClassSelect
5. Assemble SearchForm with validation

### Phase 4: Results Display (Day 3-4)
1. Create FlightCard component
2. Create FlightResults container
3. Add loading skeletons
4. Add empty/error states

### Phase 5: Sorting & Filtering (Day 4-5)
1. Implement SortOptions component
2. Implement FilterPanel with all filters
3. Connect to Zustand store
4. Client-side filtering logic

### Phase 6: Polish (Day 5-6)
1. Modify search functionality
2. Responsive design
3. Animations/transitions
4. Error handling improvements
5. Performance optimization

---

## Amadeus API Quick Reference

### Authentication
```
POST https://test.api.amadeus.com/v1/security/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={key}&client_secret={secret}
```

### Airport Search
```
GET https://test.api.amadeus.com/v1/reference-data/locations
?subType=CITY,AIRPORT&keyword={query}&page[limit]=10
```

### Flight Search
```
GET https://test.api.amadeus.com/v2/shopping/flight-offers
?originLocationCode=PAR
&destinationLocationCode=NYC
&departureDate=2025-02-15
&returnDate=2025-02-22
&adults=1
&travelClass=ECONOMY
&max=50
```

---

## Test Cities (Amadeus Test Environment)
Use these IATA codes for reliable test data:
- **PAR** - Paris (all airports)
- **LON** - London
- **NYC** - New York
- **MAD** - Madrid
- **CDG** - Paris Charles de Gaulle
- **LHR** - London Heathrow
- **JFK** - New York JFK

---

## Deliverables Checklist

- [ ] Next.js project with TypeScript + Tailwind
- [ ] ASP.NET Core API with Amadeus integration
- [ ] Search form with all required fields
- [ ] City autocomplete with debouncing
- [ ] Date pickers with validation
- [ ] Passenger & class selection
- [ ] Flight results display
- [ ] Sorting (price, duration, time)
- [ ] Filtering (stops, time, airlines, price)
- [ ] Modify search without data loss
- [ ] Responsive design
- [ ] Loading states & error handling

---

## Getting Started Commands

### Backend
```bash
cd backend
dotnet new sln -n FlightSearch
dotnet new webapi -n FlightSearch.API
dotnet new classlib -n FlightSearch.Core
dotnet new classlib -n FlightSearch.Infrastructure
dotnet sln add **/*.csproj
```

### Frontend
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app
cd frontend
npm install @tanstack/react-query zustand date-fns lucide-react
```

---

*Use this guide as context when working with Claude Code. Start with Phase 1 and work through each phase systematically.*
