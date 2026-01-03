import { useMutation } from '@tanstack/react-query'
import { searchReturnFlights } from '@/lib/api'
import { SearchCriteria } from '@/types/search'

export function useReturnSearch() {
  return useMutation({
    mutationFn: (criteria: SearchCriteria) => searchReturnFlights(criteria),
  })
}
