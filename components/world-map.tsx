'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsAPI, createMap, createMarker, drawFlightPath } from '@/lib/googleMaps'

interface MapMarker {
  code: string
  name: string
  lat: number
  lng: number
}

interface WorldMapProps {
  departure?: MapMarker
  arrival?: MapMarker
}

export function WorldMap({ departure, arrival }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [flightPath, setFlightPath] = useState<google.maps.Polyline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('WorldMap component rendering')

  // Initialize map - run when component mounts and ref is available
  useEffect(() => {
    console.log('WorldMap useEffect running')
    console.log('mapRef.current:', mapRef.current)

    // Use setTimeout to ensure the DOM element is fully mounted
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        console.log('mapRef.current is still null after timeout')
        setError('Map container not found')
        setIsLoading(false)
        return
      }

      console.log('About to call loadGoogleMapsAPI()')
      loadGoogleMapsAPI()
        .then(() => {
          console.log('Google Maps API loaded, creating map instance')
          const mapInstance = createMap(
            mapRef.current!,
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_STYLE_ID!
          )
          setMap(mapInstance)
          setIsLoading(false)
          console.log('Map instance created successfully')
        })
        .catch((err) => {
          console.error('Failed to load Google Maps:', err)
          setError('Failed to load map')
          setIsLoading(false)
        })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Update markers and flight path
  useEffect(() => {
    if (!map) return

    // Clear existing markers and path
    markers.forEach(m => m.setMap(null))
    flightPath?.setMap(null)

    const newMarkers: google.maps.Marker[] = []

    if (departure && arrival) {
      // Create departure marker (purple)
      const depMarker = createMarker(
        map,
        departure.lat,
        departure.lng,
        departure.code,
        '#667eea'
      )
      newMarkers.push(depMarker)

      // Create arrival marker (blue)
      const arrMarker = createMarker(
        map,
        arrival.lat,
        arrival.lng,
        arrival.code,
        '#4facfe'
      )
      newMarkers.push(arrMarker)

      // Draw flight path
      const path = drawFlightPath(
        map,
        { lat: departure.lat, lng: departure.lng },
        { lat: arrival.lat, lng: arrival.lng }
      )
      setFlightPath(path)

      // Fit bounds to show both markers
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: departure.lat, lng: departure.lng })
      bounds.extend({ lat: arrival.lat, lng: arrival.lng })
      map.fitBounds(bounds)
    }

    setMarkers(newMarkers)
  }, [map, departure, arrival])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-blue-200/50">
      {/* Map container - always rendered so ref can attach */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
          <p className="text-foreground/60">Loading map...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
