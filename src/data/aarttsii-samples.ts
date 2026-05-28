export interface Sample {
  id: string
  label: string
  image: string
  size: string
  estimate: {
    category: string
    ci: number
    factors: string[]
    detected_details: { label: string; impact: string }[]
    price_min: number
    price_max: number
  }
}

export const samples: Sample[] = [
  {
    id: 's1',
    label: 'Crochet Bear',
    image: '/aarttsii-samples/bear.jpg',
    size: 'Standard (8-12 inches)',
    estimate: {
      category: 'standard_amigurumi',
      ci: 4.2,
      factors: ['10 separately sewn parts', 'Three colour yarn changes', 'Embroidered face details'],
      detected_details: [{ label: 'Bow tie', impact: 'medium' }, { label: 'Embroidered eyes', impact: 'low' }],
      price_min: 1200,
      price_max: 1800,
    },
  },
  {
    id: 's2',
    label: 'Sunflower Bouquet',
    image: '/aarttsii-samples/sunflower.jpg',
    size: 'Standard (8-12 inches)',
    estimate: {
      category: 'bouquet',
      ci: 5.8,
      factors: ['22 petals crocheted individually', 'Wire stems for posing', 'Five different yarn colours'],
      detected_details: [{ label: 'Wire armature', impact: 'medium' }, { label: 'Petal detail', impact: 'low' }],
      price_min: 2000,
      price_max: 3200,
    },
  },
  {
    id: 's3',
    label: 'Dragon Character',
    image: '/aarttsii-samples/dragon.jpg',
    size: 'Large (12-18 inches)',
    estimate: {
      category: 'complex_character',
      ci: 7.4,
      factors: ['18 parts including wings', 'Complex organic shaping', 'Scale texture stitching'],
      detected_details: [{ label: 'Wings', impact: 'high' }, { label: 'Horns', impact: 'medium' }, { label: 'Claws', impact: 'low' }],
      price_min: 3500,
      price_max: 5500,
    },
  },
]
