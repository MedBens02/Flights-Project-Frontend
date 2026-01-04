import { useQuery } from '@tanstack/react-query'
import { getSeatMap } from '@/lib/api'
import type { SeatMapResponse } from '@/types/amadeus'

export function useSeatMap(flightOffer: any | null, enabled: boolean = true) {
  return useQuery<SeatMapResponse>({
    queryKey: ['seatmap', flightOffer?.id],
    queryFn: () => getSeatMap(flightOffer),
    enabled: enabled && !!flightOffer,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
