import { useQuery } from '@tanstack/react-query'
import { getFlightUpsells } from '@/lib/api'
import type { UpsellResponse } from '@/types/amadeus'

export function useFlightUpsells(flightOffer: any | null, enabled: boolean = true) {
  return useQuery<UpsellResponse>({
    queryKey: ['upsells', flightOffer?.id],
    queryFn: () => getFlightUpsells(flightOffer),
    enabled: enabled && !!flightOffer,
    staleTime: 10 * 60 * 1000,  // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
