export interface Creator {
  id: string
  handle: string
  name: string
  bio: string
  followers: number
  niche: string
  nicheLabel: string
}

export const creators: Creator[] = [
  { id: 'c1', handle: '@maya_codes', name: 'Maya Chen', bio: 'Building in public. AI/ML eng.', followers: 24300, niche: 'tech', nicheLabel: 'AI/ML Insights' },
  { id: 'c2', handle: '@designwithraj', name: 'Raj Patel', bio: 'Product designer. Making interfaces that don\'t suck.', followers: 18700, niche: 'design', nicheLabel: 'UI/UX Design' },
  { id: 'c3', handle: '@sarahbuilds', name: 'Sarah Kim', bio: 'Indie hacker. 3 exits.', followers: 45200, niche: 'startups', nicheLabel: 'Startups' },
  { id: 'c4', handle: '@devopsdave', name: 'Dave Morrison', bio: 'Infra nerd. Open source maintainer.', followers: 12100, niche: 'devops', nicheLabel: 'Infrastructure' },
  { id: 'c5', handle: '@contentqueen_', name: 'Priya Sharma', bio: 'Creator economy analyst.', followers: 31500, niche: 'creator-economy', nicheLabel: 'Creator Economy' },
  { id: 'c6', handle: '@alexfromml', name: 'Alex Torres', bio: 'ML research → production.', followers: 8900, niche: 'ai-ml', nicheLabel: 'ML Research' },
]

export interface Qualification {
  overallScore: number
  brandSafety: number
  engagementQuality: number
  nicheRelevance: number
  networkPosition: number
  networkGrade: string
  networkScore: number
  consistency: string
  consistencyScore: string
  status: 'ELITE' | 'RISING' | 'CONSISTENT' | 'VOLATILE'
  niche: string
  audienceType: string
  topTopics: string[]
  risk: 'low' | 'medium' | 'high'
}

export const qualifications: Record<string, Qualification> = {
  c1: { overallScore: 87, brandSafety: 94, engagementQuality: 82, nicheRelevance: 91, networkPosition: 78, networkGrade: 'A-', networkScore: 8.7, consistency: 'high', consistencyScore: '9/12', status: 'ELITE', niche: 'AI/ML Engineering', audienceType: 'Technical decision-makers', topTopics: ['LLM deployment', 'ML ops', 'Python tooling'], risk: 'low' },
  c2: { overallScore: 74, brandSafety: 88, engagementQuality: 71, nicheRelevance: 69, networkPosition: 65, networkGrade: 'B+', networkScore: 7.8, consistency: 'medium', consistencyScore: '9/12', status: 'RISING', niche: 'Product Design', audienceType: 'Design & product teams', topTopics: ['UI patterns', 'Design systems', 'Figma'], risk: 'low' },
  c3: { overallScore: 92, brandSafety: 90, engagementQuality: 95, nicheRelevance: 88, networkPosition: 94, networkGrade: 'A', networkScore: 8.5, consistency: 'high', consistencyScore: '10/12', status: 'ELITE', niche: 'Startups & Indie Hacking', audienceType: 'Founders & builders', topTopics: ['Revenue growth', 'PMF', 'Bootstrapping'], risk: 'low' },
  c4: { overallScore: 61, brandSafety: 85, engagementQuality: 54, nicheRelevance: 72, networkPosition: 48, networkGrade: 'B', networkScore: 7.2, consistency: 'medium', consistencyScore: '7/12', status: 'CONSISTENT', niche: 'DevOps & Infrastructure', audienceType: 'Backend engineers', topTopics: ['Kubernetes', 'CI/CD', 'Cloud costs'], risk: 'medium' },
  c5: { overallScore: 83, brandSafety: 92, engagementQuality: 79, nicheRelevance: 95, networkPosition: 72, networkGrade: 'B+', networkScore: 7.5, consistency: 'high', consistencyScore: '8/12', status: 'RISING', niche: 'Creator Economy', audienceType: 'Marketing & brand teams', topTopics: ['Creator tools', 'Platform economics', 'Sponsorships'], risk: 'low' },
  c6: { overallScore: 69, brandSafety: 96, engagementQuality: 62, nicheRelevance: 85, networkPosition: 55, networkGrade: 'C+', networkScore: 6.9, consistency: 'low', consistencyScore: '6/12', status: 'VOLATILE', niche: 'ML Research', audienceType: 'Researchers & ML engineers', topTopics: ['Transformers', 'Fine-tuning', 'Benchmarks'], risk: 'low' },
}
