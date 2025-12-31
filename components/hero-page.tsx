"use client"

import { useState } from "react"
import FluidLoader from "./fluid-loader"
import Image from "next/image"

interface HeroPageProps {
  onEnter: () => void
}

export default function HeroPage({ onEnter }: HeroPageProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExplore = () => {
    setIsLoading(true)
    setTimeout(() => {
      onEnter()
    }, 2000)
  }

  if (isLoading) {
    return <FluidLoader message="Preparing your flight search..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-secondary to-accent flex items-center justify-center overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="mb-12 inline-block">
          <div className="relative">
            {/* White gradient cloud behind logo */}
            <div className="absolute inset-0 -inset-x-12 -inset-y-8 bg-gradient-radial from-white/40 via-white/20 to-transparent rounded-full blur-2xl" />

            <div className="relative transform hover:scale-110 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="SKYSCAN"
                width={180}
                height={110}
                className="mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">Explore the Skies</h1>

        <p className="text-base md:text-xl text-white/80 mb-8 font-light leading-relaxed">
          Discover millions of flights across the globe. Compare prices, find the best deals, and book your next
          adventure in seconds with SKYSCAN.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleExplore}
            className="px-8 py-4 rounded-2xl bg-white text-primary font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-2xl hover:shadow-white/20"
          >
            Explore Flights
          </button>
          <button
            onClick={handleExplore}
            className="px-8 py-4 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-lg border border-white/30 hover:bg-white/30 transition-colors duration-300"
          >
            Learn More
          </button>
        </div>

        <div className="animate-bounce">
          <svg className="w-6 h-6 mx-auto text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Decorative shapes */}
      <div className="absolute bottom-0 left-0 right-0 h-20">
        <svg className="w-full h-full" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0,20 Q300,0 600,20 T1200,20 L1200,60 L0,60 Z" fill="oklch(0.98 0 0)" />
        </svg>
      </div>
    </div>
  )
}
