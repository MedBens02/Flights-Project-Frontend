import { useQuery } from '@tanstack/react-query'
import { searchAirports } from '@/lib/api'

export function useAirportSearch(keyword: string) {
  return useQuery({
    queryKey: ['airports', keyword],
    queryFn: () => searchAirports(keyword),
    enabled: keyword.length >= 2,  // Only search if 2+ characters
    staleTime: 1000 * 60 * 60,  // Cache for 1 hour
  })
}
