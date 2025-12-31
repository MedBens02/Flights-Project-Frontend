// Keep existing Flight interface from app/page.tsx
export interface Flight {
  id: string
  airline: string
  departure: {
    city: string
    time: string
    date: string
  }
  arrival: {
    city: string
    time: string
    date: string
  }
  duration: string
  stops: number
  price: number
  currency: string
  seats: number
}
