import type { TravelClass } from '@/types/search'
import type { UILuggageOption } from '@/types/amadeus'

/**
 * Generate realistic mock luggage options based on cabin class
 * Different cabin classes have different included baggage and pricing
 */
export function generateMockLuggageOptions(cabinClass: TravelClass): UILuggageOption[] {
  const options: UILuggageOption[] = []

  // Cabin class determines included baggage
  const luggageConfig = {
    economy: {
      checkedBags: 1,
      checkedWeight: '23kg',
      extraBagPrice: 45,
    },
    premium_economy: {
      checkedBags: 2,
      checkedWeight: '23kg',
      extraBagPrice: 35,
    },
    business: {
      checkedBags: 2,
      checkedWeight: '32kg',
      extraBagPrice: 25,
    },
    first: {
      checkedBags: 3,
      checkedWeight: '32kg',
      extraBagPrice: 0,  // unlimited - no charge for extra bags
    },
  }

  const config = luggageConfig[cabinClass]

  // Standard included luggage
  for (let i = 1; i <= config.checkedBags; i++) {
    options.push({
      id: `standard-${i}`,
      label: `Checked Bag ${i}`,
      weight: config.checkedWeight,
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

  // Extra bags (if applicable)
  if (config.extraBagPrice > 0) {
    options.push({
      id: 'extra1',
      label: `Extra Bag ${config.checkedBags + 1}`,
      weight: config.checkedWeight,
      price: config.extraBagPrice,
      included: false,
    })

    options.push({
      id: 'extra2',
      label: `Extra Bag ${config.checkedBags + 2}`,
      weight: config.checkedWeight,
      price: Math.round(config.extraBagPrice * 1.5),
      included: false,
    })
  }

  return options
}
