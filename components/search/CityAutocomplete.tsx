'use client'

import { useState, useRef, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useAirportSearch } from '@/hooks/useAirportSearch'
import { Airport } from '@/types/airport'
import { Input } from '@/components/ui/input'

interface Props {
  label: string
  placeholder: string
  value: Airport | null
  onChange: (airport: Airport | null) => void
}

export function CityAutocomplete({ label, placeholder, value, onChange }: Props) {
  const [query, setQuery] = useState(value?.cityName || '')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const { data: airports, isLoading } = useAirportSearch(debouncedQuery)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (airport: Airport) => {
    onChange(airport)
    setQuery(`${airport.cityName} (${airport.iataCode})`)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-xs font-semibold text-foreground/70 mb-2 block uppercase tracking-wider">
        {label}
      </label>
      <Input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (!e.target.value) onChange(null)
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-white text-foreground border-2 border-blue-100/50 rounded-xl focus:border-primary focus:shadow-lg transition-all"
      />

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border-2 border-blue-100/50 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-foreground/60">Loading...</div>
          ) : airports?.length ? (
            airports.map((airport) => (
              <button
                key={airport.iataCode}
                onClick={() => handleSelect(airport)}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-blue-50 last:border-0 group"
              >
                <div className="font-semibold text-primary group-hover:text-primary/80">
                  {airport.iataCode}
                </div>
                <div className="text-xs text-foreground/60">
                  {airport.cityName}, {airport.countryName}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-foreground/60">No airports found</div>
          )}
        </div>
      )}
    </div>
  )
}
