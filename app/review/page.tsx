"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBooking } from "@/contexts/BookingContext"
import BookingReview from "@/components/booking-review"
import Header from "@/components/header"

export default function ReviewPage() {
  const { bookingState, setCurrentStep } = useBooking()
  const router = useRouter()

  useEffect(() => {
    if (!bookingState.outboundFlight.flight) {
      router.push('/search')
    } else {
      setCurrentStep('review')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingState.outboundFlight.flight])

  if (!bookingState.outboundFlight.flight) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/20">
      <Header />
      <BookingReview />
    </div>
  )
}
