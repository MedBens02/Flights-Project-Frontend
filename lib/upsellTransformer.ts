import type { UpsellResponse, UILuggageOption } from '@/types/amadeus'

/**
 * Transform Amadeus Upsell API response to UI-friendly luggage options
 */
export function transformUpsellToLuggage(
  upsellResponse: UpsellResponse,
  currentCabinClass: string
): UILuggageOption[] {
  if (!upsellResponse?.data || upsellResponse.data.length === 0) {
    return []
  }

  const options: UILuggageOption[] = []

  // Find offer matching current cabin (or use first offer)
  const relevantOffer = upsellResponse.data.find(offer => {
    const firstTraveler = offer.travelerPricings?.[0]
    const firstSegment = firstTraveler?.fareDetailsBySegment?.[0]
    return firstSegment?.cabin.toLowerCase() === currentCabinClass.toLowerCase()
  }) || upsellResponse.data[0]

  if (!relevantOffer) return []

  // Extract included baggage
  const firstTraveler = relevantOffer.travelerPricings?.[0]
  const firstSegment = firstTraveler?.fareDetailsBySegment?.[0]
  const includedBags = firstSegment?.includedCheckedBags

  // Standard included luggage
  if (includedBags && includedBags.quantity && includedBags.quantity > 0) {
    options.push({
      id: 'standard',
      label: 'Standard Luggage',
      weight: `${includedBags.weight || 23}${includedBags.weightUnit || 'KG'}`,
      price: 0,
      included: true,
    })
  }

  // Cabin baggage (always free)
  options.push({
    id: 'cabin',
    label: 'Cabin Baggage',
    weight: '7kg',
    price: 0,
    included: true,
  })

  // Extract additional baggage pricing
  const additionalServices = relevantOffer.price?.additionalServices || []
  const baggageService = additionalServices.find(s => s.type === 'CHECKED_BAGS')

  if (baggageService) {
    const extraBagPrice = parseFloat(baggageService.amount)

    options.push({
      id: 'extra1',
      label: '1st Extra Bag',
      weight: '23kg',
      price: extraBagPrice,
      included: false,
    })

    options.push({
      id: 'extra2',
      label: '2nd Extra Bag',
      weight: '23kg',
      price: extraBagPrice * 1.5,
      included: false,
    })
  }

  return options
}
