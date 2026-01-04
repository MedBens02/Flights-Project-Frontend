'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { BookingState, BookingStep, FlightLegSelection } from '@/types/booking'
import { SearchCriteria } from '@/types/search'
import { Flight } from '@/types/flight'

interface BookingContextType {
  bookingState: BookingState
  setSearchCriteria: (criteria: SearchCriteria) => void
  updateSearchCriteria: (updates: Partial<SearchCriteria>) => void
  setCurrentStep: (step: BookingStep) => void
  selectOutboundFlight: (flight: Flight, rawOffer: any) => void
  selectReturnFlight: (flight: Flight, rawOffer: any) => void
  updateOutboundSeats: (seats: string[], luggage: string[], extrasPrice?: number) => void
  updateReturnSeats: (seats: string[], luggage: string[], extrasPrice?: number) => void
  setOutboundSearchResults: (flights: Flight[], rawOffers: Record<string, any>) => void
  setReturnSearchResults: (flights: Flight[], rawOffers: Record<string, any>) => void
  resetBooking: () => void
  canProceedToReturn: () => boolean
  canProceedToReview: () => boolean
}

const initialFlightLegSelection: FlightLegSelection = {
  flight: null,
  rawOffer: null,
  selectedSeats: [],
  selectedLuggage: ['standard', 'cabin']
}

const initialState: BookingState = {
  searchCriteria: null,
  outboundFlight: { ...initialFlightLegSelection },
  returnFlight: null,
  currentStep: 'search',
  outboundSearchResults: null,
  returnSearchResults: null
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingState, setBookingState] = useState<BookingState>(initialState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Restore from sessionStorage AFTER hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('bookingState')
      if (stored) {
        try {
          setBookingState(JSON.parse(stored))
        } catch {
          // Keep initial state on error
        }
      }
      setIsHydrated(true)
    }
  }, [])

  // Persist to sessionStorage on state changes (but only after initial hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('bookingState', JSON.stringify(bookingState))
    }
  }, [bookingState, isHydrated])

  const setSearchCriteria = (criteria: SearchCriteria) => {
    setBookingState(prev => ({
      ...prev,
      searchCriteria: criteria,
      // Initialize returnFlight based on trip type
      returnFlight: criteria.tripType === 'roundtrip' ? { ...initialFlightLegSelection } : null
    }))
  }

  const updateSearchCriteria = (updates: Partial<SearchCriteria>) => {
    setBookingState(prev => ({
      ...prev,
      searchCriteria: prev.searchCriteria
        ? { ...prev.searchCriteria, ...updates }
        : null
    }))
  }

  const setCurrentStep = (step: BookingStep) => {
    setBookingState(prev => ({ ...prev, currentStep: step }))
  }

  const selectOutboundFlight = (flight: Flight, rawOffer: any) => {
    setBookingState(prev => ({
      ...prev,
      outboundFlight: {
        flight,
        rawOffer,
        selectedSeats: [],
        selectedLuggage: ['standard', 'cabin']
      },
      // Reset return flight when changing outbound
      returnFlight: prev.searchCriteria?.tripType === 'roundtrip'
        ? { ...initialFlightLegSelection }
        : null
    }))
  }

  const selectReturnFlight = (flight: Flight, rawOffer: any) => {
    setBookingState(prev => ({
      ...prev,
      returnFlight: {
        flight,
        rawOffer,
        selectedSeats: [],
        selectedLuggage: ['standard', 'cabin']
      }
    }))
  }

  const updateOutboundSeats = (seats: string[], luggage: string[], extrasPrice?: number) => {
    setBookingState(prev => ({
      ...prev,
      outboundFlight: {
        ...prev.outboundFlight,
        selectedSeats: seats,
        selectedLuggage: luggage,
        extrasPrice: extrasPrice || 0
      }
    }))
  }

  const updateReturnSeats = (seats: string[], luggage: string[], extrasPrice?: number) => {
    if (!bookingState.returnFlight) return

    setBookingState(prev => ({
      ...prev,
      returnFlight: prev.returnFlight ? {
        ...prev.returnFlight,
        selectedSeats: seats,
        selectedLuggage: luggage,
        extrasPrice: extrasPrice || 0
      } : null
    }))
  }

  const setOutboundSearchResults = (flights: Flight[], rawOffers: Record<string, any>) => {
    setBookingState(prev => ({
      ...prev,
      outboundSearchResults: { flights, rawOffers }
    }))
  }

  const setReturnSearchResults = (flights: Flight[], rawOffers: Record<string, any>) => {
    setBookingState(prev => ({
      ...prev,
      returnSearchResults: { flights, rawOffers }
    }))
  }

  const resetBooking = () => {
    setBookingState(initialState)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bookingState')
    }
  }

  const canProceedToReturn = (): boolean => {
    return !!(
      bookingState.outboundFlight.flight &&
      bookingState.outboundFlight.selectedSeats.length > 0 &&
      bookingState.searchCriteria?.tripType === 'roundtrip'
    )
  }

  const canProceedToReview = (): boolean => {
    const outboundValid = !!(
      bookingState.outboundFlight.flight &&
      bookingState.outboundFlight.selectedSeats.length > 0
    )

    if (bookingState.searchCriteria?.tripType === 'oneway') {
      return outboundValid
    }

    const returnValid = !!(
      bookingState.returnFlight?.flight &&
      bookingState.returnFlight?.selectedSeats.length > 0
    )

    return outboundValid && returnValid
  }

  const value: BookingContextType = {
    bookingState,
    setSearchCriteria,
    updateSearchCriteria,
    setCurrentStep,
    selectOutboundFlight,
    selectReturnFlight,
    updateOutboundSeats,
    updateReturnSeats,
    setOutboundSearchResults,
    setReturnSearchResults,
    resetBooking,
    canProceedToReturn,
    canProceedToReview
  }

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider')
  }
  return context
}
