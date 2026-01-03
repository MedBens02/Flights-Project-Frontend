"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBooking } from "@/contexts/BookingContext"
import OutboundResultsView from "@/components/outbound-results-view"
import Header from "@/components/header"

export default function OutboundFlightsPage() {
  const { bookingState, setCurrentStep } = useBooking()
  const router = useRouter()

  useEffect(() => {
    if (!bookingState.searchCriteria) {
      router.push('/search')
    } else {
      setCurrentStep('outbound-results')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingState.searchCriteria])

  if (!bookingState.searchCriteria) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/20">
      <Header />
      <OutboundResultsView />
    </div>
  )
}
