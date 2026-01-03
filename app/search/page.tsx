"use client"

import { useEffect } from "react"
import { useBooking } from "@/contexts/BookingContext"
import SearchForm from "@/components/search-form"
import Header from "@/components/header"

export default function SearchPage() {
  const { setCurrentStep } = useBooking()

  useEffect(() => {
    setCurrentStep('search')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/20">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-16">
        <SearchForm />
      </div>
    </div>
  )
}
