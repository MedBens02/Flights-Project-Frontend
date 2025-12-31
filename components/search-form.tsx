"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorldMap } from "@/components/world-map"
import { CityAutocomplete } from "@/components/search/CityAutocomplete"
import type { SearchParams } from "@/app/page"
import { Airport } from "@/types/airport"

interface SearchFormProps {
  onSearch: (params: SearchParams) => void
  initialParams: SearchParams | null
}

export default function SearchForm({ onSearch, initialParams }: SearchFormProps) {
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">(initialParams?.tripType || "roundtrip")
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null)
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null)
  const [departureDate, setDepartureDate] = useState(initialParams?.departureDate || "")
  const [returnDate, setReturnDate] = useState(initialParams?.returnDate || "")
  const [passengers, setPassengers] = useState(initialParams?.passengers || 1)
  const [className, setClassName] = useState<"economy" | "business" | "first">(initialParams?.className || "economy")

  // Create map markers from selected airports
  const departureMarker = departureAirport ? {
    code: departureAirport.iataCode,
    name: departureAirport.name,
    lat: departureAirport.lat,
    lng: departureAirport.lng
  } : undefined

  const arrivalMarker = arrivalAirport ? {
    code: arrivalAirport.iataCode,
    name: arrivalAirport.name,
    lat: arrivalAirport.lat,
    lng: arrivalAirport.lng
  } : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (departureAirport && arrivalAirport && departureDate) {
      onSearch({
        tripType,
        departureCity: departureAirport.iataCode,
        arrivalCity: arrivalAirport.iataCode,
        departureDate,
        returnDate: tripType === "roundtrip" ? returnDate : "",
        passengers,
        className,
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* World Map - Left Side */}
      <div className="flex flex-col justify-center">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border-2 border-blue-100/50 shadow-lg h-full min-h-96">
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Route</h3>
          <WorldMap departure={departureMarker} arrival={arrivalMarker} />
        </div>
      </div>

      {/* Search Form - Right Side */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Type Selection */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border-2 border-blue-100/30 shadow-md">
          <label className="text-sm font-semibold text-foreground/80 mb-4 block">Trip Type</label>
          <div className="flex gap-4">
            {(["roundtrip", "oneway"] as const).map((type) => (
              <label key={type} className="flex-1 relative cursor-pointer group">
                <input
                  type="radio"
                  name="tripType"
                  value={type}
                  checked={tripType === type}
                  onChange={(e) => setTripType(e.target.value as typeof type)}
                  className="sr-only"
                />
                <div
                  className={`p-4 rounded-xl text-center font-medium transition-all duration-200 border-2 ${
                    tripType === type
                      ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                      : "bg-white text-foreground border-transparent hover:border-primary/30 hover:bg-blue-50/50"
                  }`}
                >
                  {type === "roundtrip" ? "Round Trip" : "One Way"}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Main Search Fields */}
        <div className="space-y-4">
          {/* Departure and Arrival */}
          <div className="grid grid-cols-2 gap-4">
            <CityAutocomplete
              label="From"
              placeholder="Departure airport"
              value={departureAirport}
              onChange={setDepartureAirport}
            />
            <CityAutocomplete
              label="To"
              placeholder="Arrival airport"
              value={arrivalAirport}
              onChange={setArrivalAirport}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block uppercase tracking-wider">
                Departure
              </label>
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-white text-foreground border-2 border-blue-100/50 rounded-xl focus:border-primary focus:shadow-lg transition-all"
              />
            </div>

            {tripType === "roundtrip" && (
              <div>
                <label className="text-xs font-semibold text-foreground/70 mb-2 block uppercase tracking-wider">
                  Return
                </label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-white text-foreground border-2 border-blue-100/50 rounded-xl focus:border-primary focus:shadow-lg transition-all"
                />
              </div>
            )}
          </div>

          {/* Passengers and Class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block uppercase tracking-wider">
                Passengers
              </label>
              <div className="flex items-center border-2 border-blue-100/50 rounded-xl bg-white overflow-hidden hover:shadow-lg transition-shadow">
                <button
                  type="button"
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="px-4 py-3 text-primary font-bold hover:bg-blue-50 transition-colors"
                >
                  −
                </button>
                <span className="flex-1 text-center font-semibold text-foreground">{passengers}</span>
                <button
                  type="button"
                  onClick={() => setPassengers(Math.min(9, passengers + 1))}
                  className="px-4 py-3 text-primary font-bold hover:bg-blue-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block uppercase tracking-wider">
                Class
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value as typeof className)}
                className="w-full px-4 py-3 border-2 border-blue-100/50 rounded-xl bg-white text-foreground focus:outline-none focus:border-primary focus:shadow-lg transition-all font-medium"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-primary-foreground py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Explore Flights
        </Button>
      </form>
    </div>
  )
}
