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
    image: '/aarttsii-samples/miffy-front.webp',
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
    label: 'Bear with Muffler',
    image: '/aarttsii-samples/bear-front.webp',
    size: 'Mini (4-6 inches)',
    estimate: {
      category: 'standard_amigurumi',
      ci: 3.6,
      factors: ['Brown chunky body with round ears', 'White ribbed muffler scarf wrap', 'Safety eyes with embroidered nose'],
      detected_details: [{ label: 'Muffler wrap', impact: 'medium' }, { label: 'Keychain ring', impact: 'low' }, { label: 'Chunky yarn', impact: 'low' }],
      price_min: 500,
      price_max: 800,
    },
  },
  {
    id: 's3',
    label: 'Jellyfish Keychain',
    image: '/aarttsii-samples/jellyfish-front.webp',
    size: 'Mini (3-5 inches)',
    estimate: {
      category: 'complex_novelty',
      ci: 4.5,
      factors: ['Scalloped bell cap with two-tone colour', 'Eight curled tentacle strands', 'Chain keyring attachment through dome'],
      detected_details: [{ label: 'Curled tentacles', impact: 'high' }, { label: 'Two-tone dome', impact: 'medium' }, { label: 'Scalloped edge', impact: 'medium' }],
      price_min: 600,
      price_max: 950,
    },
  },
  {
    id: 's4',
    label: 'Chef Chick',
    image: '/aarttsii-samples/chick-front.webp',
    size: 'Standard (8-12 inches)',
    estimate: {
      category: 'character_amigurumi',
      ci: 4.2,
      factors: ['Separate chef hat with white pompom top', 'Two-colour body with apron detail', 'Knife accessory with wrapped handle'],
      detected_details: [{ label: 'Chef hat', impact: 'medium' }, { label: 'Apron', impact: 'medium' }, { label: 'Knife accessory', impact: 'high' }],
      price_min: 800,
      price_max: 1200,
    },
  },
]
