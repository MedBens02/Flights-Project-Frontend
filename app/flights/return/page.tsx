"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBooking } from "@/contexts/BookingContext"
import ReturnResultsView from "@/components/return-results-view"
import Header from "@/components/header"

export default function ReturnFlightsPage() {
  const { bookingState, setCurrentStep } = useBooking()
  const router = useRouter()

  useEffect(() => {
    if (!bookingState.outboundFlight.flight) {
      router.push('/flights/outbound')
    } else if (!bookingState.searchCriteria?.returnDate) {
      router.push('/search')
    } else {
      setCurrentStep('return-results')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingState.outboundFlight.flight, bookingState.searchCriteria?.returnDate])

  if (!bookingState.outboundFlight.flight) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/20">
      <Header />
      <ReturnResultsView />
    </div>
  )
}
