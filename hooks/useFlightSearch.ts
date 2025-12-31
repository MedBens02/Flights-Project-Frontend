import { useMutation } from '@tanstack/react-query'
import { searchFlights } from '@/lib/api'
import { SearchCriteria } from '@/types/search'

export function useFlightSearch() {
  return useMutation({
    mutationFn: (criteria: SearchCriteria) => searchFlights(criteria),
  })
}
