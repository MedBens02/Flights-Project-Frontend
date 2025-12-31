"use client"

import { Button } from "@/components/ui/button"
import type { Flight } from "@/app/page"

interface FlightCardProps {
  flight: Flight
  onBook: () => void
}

export default function FlightCard({ flight, onBook }: FlightCardProps) {
  return (
    <div
      onClick={onBook}
      className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 hover:scale-105 cursor-pointer"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Airline Info */}
        <div className="md:col-span-2">
          <div className="font-semibold text-foreground mb-2">{flight.airline}</div>
          <div className="text-xs text-foreground/60 space-y-1">
            <div>Flight #{flight.id}</div>
            <div className="inline-block bg-accent/20 text-accent px-2 py-1 rounded-full text-xs font-medium">
              {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
            </div>
          </div>
        </div>

        {/* Departure Time */}
        <div className="md:col-span-2">
          <div className="text-2xl font-bold text-foreground">{flight.departure.time}</div>
          <div className="text-sm text-foreground/60">{flight.departure.city}</div>
        </div>

        {/* Duration & Stops */}
        <div className="md:col-span-2 text-center">
          <div className="text-sm font-semibold text-primary mb-1">{flight.duration}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-foreground/60">
            <div className="flex-1 h-px bg-border"></div>
            <span>{flight.stops === 0 ? "✓ Direct" : `${flight.stops} stop`}</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
        </div>

        {/* Arrival Time */}
        <div className="md:col-span-2">
          <div className="text-2xl font-bold text-foreground">{flight.arrival.time}</div>
          <div className="text-sm text-foreground/60">{flight.arrival.city}</div>
        </div>

        {/* Seat Availability */}
        <div className="md:col-span-1 text-center">
          <div className="text-xs text-foreground/60 mb-1">Seats</div>
          <div className={`font-bold text-lg ${flight.seats <= 5 ? "text-destructive" : "text-accent"}`}>
            {flight.seats}
          </div>
        </div>

        {/* Price & Book */}
        <div className="md:col-span-1 text-right">
          <div className="text-sm text-foreground/60 mb-2">From</div>
          <div className="text-3xl font-bold text-primary mb-3">€{flight.price}</div>
          <Button onClick={onBook} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
            Select
          </Button>
        </div>
      </div>
    </div>
  )
}
