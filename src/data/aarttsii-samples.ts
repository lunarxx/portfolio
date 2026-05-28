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
    label: 'Miffy Bunny',
    image: '/aarttsii-samples/bunny.png',
    size: 'Mini (4-6 inches)',
    estimate: {
      category: 'standard_amigurumi',
      ci: 3.1,
      factors: ['6 separately crocheted parts', 'Two colour yarn (white + pink)', 'Embroidered face details'],
      detected_details: [{ label: 'Pink bow', impact: 'low' }, { label: 'Embroidered face', impact: 'low' }],
      price_min: 450,
      price_max: 700,
    },
  },
  {
    id: 's2',
    label: 'Granny Square Bag',
    image: '/aarttsii-samples/granny-bag.png',
    size: 'Standard',
    estimate: {
      category: 'bag_granny',
      ci: 4.8,
      factors: ['9 floral granny squares joined', 'Four colour pattern with green leaves', 'Twisted strap attachment'],
      detected_details: [{ label: 'Floral motifs', impact: 'medium' }, { label: 'Twisted strap', impact: 'medium' }, { label: 'Mini bunny keychain', impact: 'high' }],
      price_min: 1200,
      price_max: 1800,
    },
  },
  {
    id: 's3',
    label: 'Strawberry Cupcake',
    image: '/aarttsii-samples/cupcake.png',
    size: 'Mini (4-6 inches)',
    estimate: {
      category: 'complex_food',
      ci: 4.2,
      factors: ['Multiple pink yarn shades for frosting layers', 'Berry topper with wire stem', 'Bow ribbon details on sides'],
      detected_details: [{ label: 'Frosting layers', impact: 'medium' }, { label: 'Berry topper', impact: 'medium' }, { label: 'Ribbon bows', impact: 'low' }],
      price_min: 600,
      price_max: 950,
    },
  },
  {
    id: 's4',
    label: 'Sheep Amigurumi',
    image: '/aarttsii-samples/sheep.png',
    size: 'Standard (8-12 inches)',
    estimate: {
      category: 'standard_amigurumi',
      ci: 3.8,
      factors: ['Textured bobble stitch for wool', 'Eight separately sewn parts', 'Contrast face and limbs'],
      detected_details: [{ label: 'Bobble texture', impact: 'medium' }, { label: 'Embroidered face', impact: 'low' }],
      price_min: 800,
      price_max: 1200,
    },
  },
]
