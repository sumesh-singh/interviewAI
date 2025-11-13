export interface Industry {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export const industries: Industry[] = [
  {
    id: 'fintech',
    name: 'FinTech',
    description: 'Financial technology companies and startups',
    icon: '💰',
    color: 'bg-green-500'
  },
  {
    id: 'healthtech',
    name: 'HealthTech',
    description: 'Healthcare technology and medical innovation',
    icon: '🏥',
    color: 'bg-blue-500'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Video game development and interactive entertainment',
    icon: '🎮',
    color: 'bg-purple-500'
  },
  {
    id: 'consulting',
    name: 'Consulting',
    description: 'Management and technology consulting firms',
    icon: '💼',
    color: 'bg-orange-500'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online retail and digital marketplace platforms',
    icon: '🛒',
    color: 'bg-pink-500'
  },
  {
    id: 'saas',
    name: 'SaaS',
    description: 'Software as a service companies and platforms',
    icon: '☁️',
    color: 'bg-indigo-500'
  },
  {
    id: 'education',
    name: 'EdTech',
    description: 'Educational technology and online learning platforms',
    icon: '📚',
    color: 'bg-yellow-500'
  },
  {
    id: 'automotive',
    name: 'Automotive Tech',
    description: 'Automotive technology and connected vehicles',
    icon: '🚗',
    color: 'bg-red-500'
  }
]

export function getIndustryById(id: string): Industry | undefined {
  return industries.find(industry => industry.id === id)
}