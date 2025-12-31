import { Loader } from '@googlemaps/js-api-loader'

let isLoaded = false
let loadPromise: Promise<typeof google> | null = null

export async function loadGoogleMapsAPI(): Promise<typeof google> {
  if (isLoaded) return google
  if (loadPromise) return loadPromise

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  console.log('Loading Google Maps API...')
  console.log('API Key present:', !!apiKey)

  if (!apiKey) {
    const error = new Error('Google Maps API key is missing. Check your .env.local file.')
    console.error(error)
    throw error
  }

  try {
    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
    })

    loadPromise = loader.load()

    const googleMaps = await loadPromise
    isLoaded = true
    console.log('Google Maps loaded successfully!')
    return googleMaps
  } catch (error) {
    console.error('Failed to load Google Maps:', error)
    loadPromise = null
    throw error
  }
}

export function createMap(element: HTMLElement, styleId: string): google.maps.Map {
  return new google.maps.Map(element, {
    mapId: styleId,
    center: { lat: 50, lng: 10 },  // Europe-centered
    zoom: 4,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
  })
}

export function createMarker(
  map: google.maps.Map,
  lat: number,
  lng: number,
  label: string,
  color: string
): google.maps.Marker {
  return new google.maps.Marker({
    position: { lat, lng },
    map,
    label: {
      text: label,
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 10,
    },
  })
}

export function drawFlightPath(
  map: google.maps.Map,
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): google.maps.Polyline {
  return new google.maps.Polyline({
    path: [from, to],
    geodesic: true,  // Curved path (great circle)
    strokeColor: '#667eea',
    strokeOpacity: 0.6,
    strokeWeight: 2,
    map,
  })
}
