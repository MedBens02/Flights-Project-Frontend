"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export default function Header() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="relative w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50">
        <div
          className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br from-primary/15 to-accent/10 rounded-full blur-3xl opacity-60"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        />

        <div
          className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br from-accent/15 to-primary/10 rounded-full blur-3xl opacity-60"
          style={{ transform: `translateY(${-scrollY * 0.15}px)`, animationDelay: "1s" }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 -z-10" />

            <div
              className="transition-all duration-300 hover:scale-105"
              style={{ transform: `translateY(${Math.sin(scrollY * 0.005) * 6}px)` }}
            >
              <Image
                src="/logo.png"
                alt="SKYSCAN Logo"
                width={200}
                height={120}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-primary/70 hover:text-primary transition-colors duration-300"
            >
              Flights
            </a>
            <a
              href="#"
              className="text-sm font-medium text-primary/70 hover:text-primary transition-colors duration-300"
            >
              Hotels
            </a>
            <a
              href="#"
              className="text-sm font-medium text-primary/70 hover:text-primary transition-colors duration-300"
            >
              Deals
            </a>
          </div>

          <div className="h-6 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent hidden md:block" />

          <button className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
            Sign In
          </button>
        </div>
      </div>

      <div className="relative h-12 md:h-16">
        <svg className="absolute inset-0 w-full h-full text-white" viewBox="0 0 1200 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(100, 200, 255, 0.1)" />
              <stop offset="50%" stopColor="rgba(0, 150, 255, 0.15)" />
              <stop offset="100%" stopColor="rgba(100, 200, 255, 0.1)" />
            </linearGradient>
          </defs>
          <path d="M0,30 Q300,10 600,30 T1200,30 L1200,80 L0,80 Z" fill="white" />
          <path d="M0,35 Q300,15 600,35 T1200,35 L1200,80 L0,80 Z" fill="url(#waveGradient)" opacity="0.6" />
          <path d="M0,40 Q300,20 600,40 T1200,40 L1200,80 L0,80 Z" fill="url(#waveGradient)" opacity="0.3" />
        </svg>
      </div>
    </header>
  )
}
