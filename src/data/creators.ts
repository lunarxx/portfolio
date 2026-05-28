export interface Creator {
  id: string
  handle: string
  name: string
  bio: string
  followers: number
  niche: string
}

export const creators: Creator[] = [
  { id: 'c1', handle: '@maya_codes', name: 'Maya Chen', bio: 'Building in public. AI/ML eng.', followers: 24300, niche: 'tech' },
  { id: 'c2', handle: '@designwithraj', name: 'Raj Patel', bio: 'Product designer. Making interfaces that don\'t suck.', followers: 18700, niche: 'design' },
  { id: 'c3', handle: '@sarahbuilds', name: 'Sarah Kim', bio: 'Indie hacker. 3 exits.', followers: 45200, niche: 'startups' },
  { id: 'c4', handle: '@devopsdave', name: 'Dave Morrison', bio: 'Infra nerd. Open source maintainer.', followers: 12100, niche: 'devops' },
  { id: 'c5', handle: '@contentqueen_', name: 'Priya Sharma', bio: 'Creator economy analyst.', followers: 31500, niche: 'creator-economy' },
  { id: 'c6', handle: '@alexfromml', name: 'Alex Torres', bio: 'ML research → production.', followers: 8900, niche: 'ai-ml' },
]

export interface Qualification {
  overallScore: number
  brandSafety: number
  engagementQuality: number
  nicheRelevance: number
  networkPosition: number
  niche: string
  audienceType: string
  topTopics: string[]
  risk: 'low' | 'medium' | 'high'
}

export const qualifications: Record<string, Qualification> = {
  c1: { overallScore: 87, brandSafety: 94, engagementQuality: 82, nicheRelevance: 91, networkPosition: 78, niche: 'AI/ML Engineering', audienceType: 'Technical decision-makers', topTopics: ['LLM deployment', 'ML ops', 'Python tooling'], risk: 'low' },
  c2: { overallScore: 74, brandSafety: 88, engagementQuality: 71, nicheRelevance: 69, networkPosition: 65, niche: 'Product Design', audienceType: 'Design & product teams', topTopics: ['UI patterns', 'Design systems', 'Figma'], risk: 'low' },
  c3: { overallScore: 92, brandSafety: 90, engagementQuality: 95, nicheRelevance: 88, networkPosition: 94, niche: 'Startups & Indie Hacking', audienceType: 'Founders & builders', topTopics: ['Revenue growth', 'PMF', 'Bootstrapping'], risk: 'low' },
  c4: { overallScore: 61, brandSafety: 85, engagementQuality: 54, nicheRelevance: 72, networkPosition: 48, niche: 'DevOps & Infrastructure', audienceType: 'Backend engineers', topTopics: ['Kubernetes', 'CI/CD', 'Cloud costs'], risk: 'medium' },
  c5: { overallScore: 83, brandSafety: 92, engagementQuality: 79, nicheRelevance: 95, networkPosition: 72, niche: 'Creator Economy', audienceType: 'Marketing & brand teams', topTopics: ['Creator tools', 'Platform economics', 'Sponsorships'], risk: 'low' },
  c6: { overallScore: 69, brandSafety: 96, engagementQuality: 62, nicheRelevance: 85, networkPosition: 55, niche: 'ML Research', audienceType: 'Researchers & ML engineers', topTopics: ['Transformers', 'Fine-tuning', 'Benchmarks'], risk: 'low' },
}
