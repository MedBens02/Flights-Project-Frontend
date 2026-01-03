import { useMutation } from '@tanstack/react-query'
import { searchOutboundFlights } from '@/lib/api'
import { SearchCriteria } from '@/types/search'

export function useOutboundSearch() {
  return useMutation({
    mutationFn: (criteria: SearchCriteria) => searchOutboundFlights(criteria),
  })
}
