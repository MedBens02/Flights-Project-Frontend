"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import html2canvas from "html2canvas"
import { useRef } from "react"

interface BookingTicketProps {
  bookingData: any
  flight: any
  searchParams: any
}

export default function BookingTicket({ bookingData, flight, searchParams }: BookingTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  const downloadTicket = async () => {
    if (!ticketRef.current) return

    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      })

      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `flight-ticket-${bookingData.bookingRef}.png`
      link.click()
    } catch (error) {
      console.error("Error downloading ticket:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Downloadable Ticket */}
      <div
        ref={ticketRef}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
      >
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Flight Ticket</h3>
              <p className="text-white/80 text-sm">Booking Reference: {bookingData.bookingRef}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">Booking Date</p>
              <p className="font-bold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Ticket Content */}
        <div className="p-8 space-y-6">
          {/* Route Section */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">From</p>
              <p className="text-white text-2xl font-bold">{flight.departure.city}</p>
              <p className="text-white/80 text-sm">{flight.departure.date}</p>
              <p className="text-white font-bold text-lg">{flight.departure.time}</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-primary to-accent mb-4"></div>
              <p className="text-white/60 text-xs mb-4">{flight.duration}</p>
              <div className="w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
            </div>

            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">To</p>
              <p className="text-white text-2xl font-bold">{flight.arrival.city}</p>
              <p className="text-white/80 text-sm">{flight.arrival.date}</p>
              <p className="text-white font-bold text-lg">{flight.arrival.time}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-white/20"></div>

          {/* Flight Details Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Airline</p>
              <p className="text-white font-bold">{flight.airline}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Flight</p>
              <p className="text-white font-bold">FL{flight.id}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Seats</p>
              <p className="text-white font-bold">{bookingData.selectedSeats.join(", ")}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Passengers</p>
              <p className="text-white font-bold">{searchParams.passengers}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-white/20"></div>

          {/* Baggage & Services */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Baggage Included</p>
              <p className="text-white">
                {bookingData.selectedLuggage
                  .filter((l: string) => ["standard", "cabin"].includes(l))
                  .map((l: string) => (l === "standard" ? "23kg Hold" : "7kg Cabin"))
                  .join(" + ")}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Class</p>
              <p className="text-white capitalize font-semibold">{searchParams.className}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-white/20"></div>

          {/* Total Price */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/30">
            <span className="text-white/80 font-semibold">Total Amount Paid</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              €{bookingData.totalPrice}
            </span>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-slate-900/50 px-8 py-4 border-t border-slate-700 text-center">
          <p className="text-white/60 text-xs">Thank you for your booking! Have a great flight!</p>
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={downloadTicket}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg"
      >
        <Download className="w-5 h-5 mr-2" />
        Download Ticket
      </Button>
    </div>
  )
}
