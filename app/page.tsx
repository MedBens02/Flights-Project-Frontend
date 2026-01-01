"use client"
import { Suspense, useState } from "react"
import Header from "@/components/header"
import SearchForm from "@/components/search-form"
import ResultsView from "@/components/results-view"
import HeroPage from "@/components/hero-page"
import { useFlightSearch } from "@/hooks/useFlightSearch"
import type { Flight } from "@/types/flight"

export interface SearchParams {
  tripType: "roundtrip" | "oneway"
  departureCity: string
  arrivalCity: string
  departureDate: string
  returnDate: string
  passengers: number
  className: "economy" | "business" | "first"
}

function HomeContent() {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)
  const { mutate: searchFlights, data, isPending } = useFlightSearch()

  // Extract flights and rawOffers from the response
  const flights = data?.flights || []
  const rawOffers = data?.rawOffers || {}

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)

    // Transform to SearchCriteria format for the API
    searchFlights({
      tripType: params.tripType,
      origin: {
        iataCode: params.departureCity,
        name: '',
        cityName: params.departureCity,
        countryName: '',
        lat: 0,
        lng: 0
      },
      destination: {
        iataCode: params.arrivalCity,
        name: '',
        cityName: params.arrivalCity,
        countryName: '',
        lat: 0,
        lng: 0
      },
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.passengers,
      travelClass: params.className,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <SearchForm onSearch={handleSearch} initialParams={searchParams} />
      {isPending && (
        <div className="mt-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground/60">Searching for flights...</p>
        </div>
      )}
      {flights && flights.length > 0 && !isPending && (
        <ResultsView
          flights={flights}
          rawOffers={rawOffers}
          searchParams={searchParams!}
          onModifySearch={handleSearch}
        />
      )}
    </div>
  )
}

export default function Home() {
  const [showSearch, setShowSearch] = useState(false)

  if (!showSearch) {
    return <HeroPage onEnter={() => setShowSearch(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/20">
      <Header />
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </div>
  )
}
