import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "./providers"
import { BookingProvider } from "@/contexts/BookingContext"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SkySearch - Flight Booking",
  description: "Find and book the best flights with SkySearch. Compare prices, filters, and book your perfect journey.",
  icons: {
    icon: "/logo.ico",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <BookingProvider>
            {children}
          </BookingProvider>
        </Providers>
      </body>
    </html>
  )
}
