import type { InterviewQuestion } from "@/types/interview"
import type { Industry } from "./industries"

export interface InterviewTemplate {
  id: string
  name: string
  description: string
  role: string
  industry?: string
  category: 'technical' | 'behavioral' | 'mixed'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number // in minutes
  seniority: 'entry' | 'mid' | 'senior'
  questions: InterviewQuestion[]
}

export const interviewTemplates: InterviewTemplate[] = [
  {
    id: 'frontend-engineer-basic',
    name: 'Frontend Engineer - Entry Level',
    description: 'Basic frontend development interview focusing on HTML, CSS, JavaScript fundamentals',
    role: 'Frontend Engineer',
    industry: 'saas',
    category: 'technical',
    difficulty: 'easy',
    duration: 45,
    seniority: 'entry',
    questions: [
      {
        id: 'fe-1',
        type: 'technical',
        difficulty: 'easy',
        question: 'Explain the difference between let, const, and var in JavaScript.',
        followUp: ['When would you use each one?', 'What is hoisting and how does it affect these declarations?'],
        timeLimit: 180
      },
      {
        id: 'fe-2',
        type: 'technical',
        difficulty: 'easy',
        question: 'What is the box model in CSS? How would you center a div both horizontally and vertically?',
        followUp: ['What are the different ways to center elements?', 'Explain flexbox vs grid for centering'],
        timeLimit: 240
      },
      {
        id: 'fe-3',
        type: 'behavioral',
        difficulty: 'easy',
        question: 'Tell me about a challenging frontend project you worked on. What made it challenging?',
        followUp: ['How did you overcome the challenges?', 'What would you do differently?'],
        timeLimit: 180
      }
    ]
  },
  {
    id: 'backend-engineer-intermediate',
    name: 'Backend Engineer - Mid Level',
    description: 'Intermediate backend development interview covering APIs, databases, and system design',
    role: 'Backend Engineer',
    industry: 'saas',
    category: 'technical',
    difficulty: 'medium',
    duration: 60,
    seniority: 'mid',
    questions: [
      {
        id: 'be-1',
        type: 'technical',
        difficulty: 'medium',
        question: 'Design a RESTful API for a simple blog system. What endpoints would you create?',
        followUp: ['How would you handle authentication?', 'What HTTP status codes would you use?'],
        timeLimit: 300
      },
      {
        id: 'be-2',
        type: 'technical',
        difficulty: 'medium',
        question: 'Explain the difference between SQL and NoSQL databases. When would you choose each?',
        followUp: ['What are ACID properties?', 'How do you handle database migrations?'],
        timeLimit: 240
      },
      {
        id: 'be-3',
        type: 'situational',
        difficulty: 'medium',
        question: 'Your API is experiencing high load and slow response times. How would you debug and optimize it?',
        followUp: ['What monitoring tools would you use?', 'How would you implement caching?'],
        timeLimit: 300
      }
    ]
  },
  {
    id: 'fullstack-senior',
    name: 'Full Stack Engineer - Senior Level',
    description: 'Senior full-stack interview covering architecture, leadership, and complex problem solving',
    role: 'Senior Full Stack Engineer',
    industry: 'saas',
    category: 'mixed',
    difficulty: 'hard',
    duration: 90,
    seniority: 'senior',
    questions: [
      {
        id: 'fs-1',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design a scalable real-time chat application. Consider the architecture, database design, and real-time communication.',
        followUp: ['How would you handle message persistence?', 'What about user presence indicators?'],
        timeLimit: 480
      },
      {
        id: 'fs-2',
        type: 'behavioral',
        difficulty: 'hard',
        question: 'Tell me about a time you had to make a critical technical decision with incomplete information. How did you approach it?',
        followUp: ['How did you communicate the decision to stakeholders?', 'What was the outcome?'],
        timeLimit: 300
      },
      {
        id: 'fs-3',
        type: 'situational',
        difficulty: 'hard',
        question: 'You discover a security vulnerability in production that could affect user data. Walk me through your response process.',
        followUp: ['How would you prevent similar issues?', 'How do you balance security with development speed?'],
        timeLimit: 360
      }
    ]
  },
  {
    id: 'product-manager',
    name: 'Product Manager - Mid Level',
    description: 'Product management interview focusing on strategy, user research, and stakeholder management',
    role: 'Product Manager',
    industry: 'saas',
    category: 'behavioral',
    difficulty: 'medium',
    duration: 60,
    seniority: 'mid',
    questions: [
      {
        id: 'pm-1',
        type: 'situational',
        difficulty: 'medium',
        question: 'You have limited engineering resources and multiple high-priority features requested by different stakeholders. How do you prioritize?',
        followUp: ['How do you communicate priorities to stakeholders?', 'What frameworks do you use for prioritization?'],
        timeLimit: 300
      },
      {
        id: 'pm-2',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Tell me about a product feature you launched that didn\'t meet expectations. What happened and how did you handle it?',
        followUp: ['What metrics did you track?', 'How did you iterate on the feature?'],
        timeLimit: 240
      },
      {
        id: 'pm-3',
        type: 'situational',
        difficulty: 'medium',
        question: 'How would you approach launching a product in a new market you\'re unfamiliar with?',
        followUp: ['What research methods would you use?', 'How would you validate product-market fit?'],
        timeLimit: 300
      }
    ]
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist - Entry to Mid Level',
    description: 'Data science interview covering statistics, machine learning, and data analysis',
    role: 'Data Scientist',
    industry: 'saas',
    category: 'technical',
    difficulty: 'medium',
    duration: 75,
    seniority: 'mid',
    questions: [
      {
        id: 'ds-1',
        type: 'technical',
        difficulty: 'medium',
        question: 'Explain the bias-variance tradeoff in machine learning. How do you identify and address each?',
        followUp: ['What are some techniques to reduce overfitting?', 'How do you validate model performance?'],
        timeLimit: 300
      },
      {
        id: 'ds-2',
        type: 'technical',
        difficulty: 'medium',
        question: 'You have a dataset with missing values. How would you approach handling them?',
        followUp: ['What are the pros and cons of different imputation methods?', 'How do you decide what to do with missing data?'],
        timeLimit: 240
      },
      {
        id: 'ds-3',
        type: 'situational',
        difficulty: 'medium',
        question: 'A business stakeholder asks you to build a model to predict customer churn. Walk me through your approach from start to finish.',
        followUp: ['What features would you consider?', 'How would you measure success?'],
        timeLimit: 360
      }
    ]
  },
  {
    id: 'behavioral-general',
    name: 'General Behavioral Interview',
    description: 'Standard behavioral interview questions suitable for any technical role',
    role: 'General',
    category: 'behavioral',
    difficulty: 'medium',
    duration: 45,
    seniority: 'mid',
    questions: [
      {
        id: 'beh-1',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Tell me about a time when you had to work with a difficult team member. How did you handle the situation?',
        followUp: ['What would you do differently?', 'How did this experience change your approach to teamwork?'],
        timeLimit: 180
      },
      {
        id: 'beh-2',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Describe a situation where you had to learn a new technology or skill quickly. How did you approach it?',
        followUp: ['What resources did you use?', 'How do you stay updated with new technologies?'],
        timeLimit: 180
      },
      {
        id: 'beh-3',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Tell me about a project you\'re particularly proud of. What made it successful?',
        followUp: ['What challenges did you face?', 'What did you learn from this project?'],
        timeLimit: 180
      },
      {
        id: 'beh-4',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Describe a time when you made a mistake. How did you handle it?',
        followUp: ['What did you learn from the mistake?', 'How do you prevent similar mistakes now?'],
        timeLimit: 180
      }
    ]
  },
  {
    id: 'system-design',
    name: 'System Design - Senior Level',
    description: 'Advanced system design interview for senior engineering roles',
    role: 'Senior Engineer',
    industry: 'saas',
    category: 'technical',
    difficulty: 'hard',
    duration: 60,
    seniority: 'senior',
    questions: [
      {
        id: 'sd-1',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design a URL shortener like bit.ly. Consider scalability, reliability, and analytics.',
        followUp: ['How would you handle custom URLs?', 'What about analytics and click tracking?'],
        timeLimit: 600
      },
      {
        id: 'sd-2',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design a distributed cache system. How would you handle cache invalidation and consistency?',
        followUp: ['What are different cache eviction policies?', 'How do you handle hot keys?'],
        timeLimit: 480
      }
    ]
  },
  {
    id: 'fintech-backend-entry',
    name: 'FinTech Backend Engineer - Entry Level',
    description: 'FinTech-focused backend interview covering payment systems, security, and financial APIs',
    role: 'Backend Engineer',
    industry: 'fintech',
    category: 'technical',
    difficulty: 'easy',
    duration: 45,
    seniority: 'entry',
    questions: [
      {
        id: 'ft-be-1',
        type: 'technical',
        difficulty: 'easy',
        question: 'What are the key security considerations when handling financial data and payments?',
        followUp: ['How would you implement PCI compliance?', 'What encryption methods would you use?'],
        timeLimit: 240
      },
      {
        id: 'ft-be-2',
        type: 'technical',
        difficulty: 'easy',
        question: 'Explain the difference between synchronous and asynchronous payment processing.',
        followUp: ['When would you use each approach?', 'How do you handle payment failures?'],
        timeLimit: 180
      },
      {
        id: 'ft-be-3',
        type: 'behavioral',
        difficulty: 'easy',
        question: 'Tell me about a time you had to work with sensitive data. How did you ensure its security?',
        followUp: ['What security best practices do you follow?', 'How do you stay updated on security threats?'],
        timeLimit: 180
      }
    ]
  },
  {
    id: 'fintech-frontend-senior',
    name: 'FinTech Frontend Engineer - Senior Level',
    description: 'Senior FinTech frontend interview focusing on trading interfaces, real-time data, and user trust',
    role: 'Senior Frontend Engineer',
    industry: 'fintech',
    category: 'technical',
    difficulty: 'hard',
    duration: 75,
    seniority: 'senior',
    questions: [
      {
        id: 'ft-fe-1',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design a real-time trading dashboard. How would you handle WebSocket connections and data synchronization?',
        followUp: ['How would you optimize for low latency?', 'What about connection failures and reconnection logic?'],
        timeLimit: 480
      },
      {
        id: 'ft-fe-2',
        type: 'technical',
        difficulty: 'hard',
        question: 'How would you implement secure client-side storage for financial data while maintaining performance?',
        followUp: ['What are the trade-offs between localStorage vs IndexedDB?', 'How do you prevent XSS attacks?'],
        timeLimit: 360
      },
      {
        id: 'ft-fe-3',
        type: 'situational',
        difficulty: 'hard',
        question: 'A critical bug is causing incorrect financial calculations in the UI. How would you handle this situation?',
        followUp: ['How do you prioritize fixes vs features?', 'What testing strategies would you implement?'],
        timeLimit: 300
      }
    ]
  },
  {
    id: 'healthtech-fullstack-mid',
    name: 'HealthTech Full Stack Engineer - Mid Level',
    description: 'HealthTech interview covering HIPAA compliance, medical data systems, and patient privacy',
    role: 'Full Stack Engineer',
    industry: 'healthtech',
    category: 'mixed',
    difficulty: 'medium',
    duration: 60,
    seniority: 'mid',
    questions: [
      {
        id: 'ht-fs-1',
        type: 'technical',
        difficulty: 'medium',
        question: 'What are the key considerations when designing a system that handles electronic health records (EHR)?',
        followUp: ['How do you ensure HIPAA compliance?', 'What about data backup and disaster recovery?'],
        timeLimit: 300
      },
      {
        id: 'ht-fs-2',
        type: 'technical',
        difficulty: 'medium',
        question: 'How would you implement patient authentication and authorization in a healthcare application?',
        followUp: ['What multi-factor authentication methods would you use?', 'How do you handle role-based access?'],
        timeLimit: 240
      },
      {
        id: 'ht-fs-3',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Describe a time you had to work with regulatory requirements. How did you ensure compliance?',
        followUp: ['How do you balance regulatory requirements with user experience?', 'What documentation practices do you follow?'],
        timeLimit: 180
      }
    ]
  },
  {
    id: 'gaming-unity-senior',
    name: 'Gaming Unity Developer - Senior Level',
    description: 'Senior Unity developer interview covering game performance, multiplayer systems, and player experience',
    role: 'Senior Unity Developer',
    industry: 'gaming',
    category: 'technical',
    difficulty: 'hard',
    duration: 90,
    seniority: 'senior',
    questions: [
      {
        id: 'gm-unity-1',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design a multiplayer game architecture that can handle 1000 concurrent players. What technologies would you use?',
        followUp: ['How would you handle game state synchronization?', 'What about cheating prevention?'],
        timeLimit: 600
      },
      {
        id: 'gm-unity-2',
        type: 'technical',
        difficulty: 'hard',
        question: 'How would you optimize a Unity game for mobile devices to maintain 60 FPS?',
        followUp: ['What profiling tools do you use?', 'How do you optimize draw calls and memory usage?'],
        timeLimit: 480
      },
      {
        id: 'gm-unity-3',
        type: 'situational',
        difficulty: 'hard',
        question: 'Your game is experiencing memory leaks and crashes on older devices. How would you debug and fix this?',
        followUp: ['What testing strategies would you implement?', 'How do you prioritize performance vs features?'],
        timeLimit: 360
      }
    ]
  },
  {
    id: 'consulting-tech-associate',
    name: 'Technology Consulting Associate - Entry Level',
    description: 'Tech consulting interview covering client communication, solution design, and business acumen',
    role: 'Technology Consultant',
    industry: 'consulting',
    category: 'mixed',
    difficulty: 'easy',
    duration: 50,
    seniority: 'entry',
    questions: [
      {
        id: 'cs-tc-1',
        type: 'behavioral',
        difficulty: 'easy',
        question: 'Tell me about a time you had to explain a technical concept to a non-technical stakeholder.',
        followUp: ['How did you tailor your explanation?', 'What challenges did you face?'],
        timeLimit: 180
      },
      {
        id: 'cs-tc-2',
        type: 'situational',
        difficulty: 'easy',
        question: 'A client wants to migrate their legacy system to the cloud. How would you approach this project?',
        followUp: ['What questions would you ask the client?', 'How would you assess risks and benefits?'],
        timeLimit: 240
      },
      {
        id: 'cs-tc-3',
        type: 'technical',
        difficulty: 'easy',
        question: 'What factors would you consider when recommending a technology stack for a client?',
        followUp: ['How do you balance technical requirements with business constraints?', 'What about team expertise and maintenance?'],
        timeLimit: 180
      }
    ]
  },
  {
    id: 'ecommerce-backend-senior',
    name: 'E-commerce Backend Engineer - Senior Level',
    description: 'Senior e-commerce backend interview focusing on scalability, inventory management, and checkout systems',
    role: 'Senior Backend Engineer',
    industry: 'ecommerce',
    category: 'technical',
    difficulty: 'hard',
    duration: 75,
    seniority: 'senior',
    questions: [
      {
        id: 'ec-be-1',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design a highly available e-commerce checkout system that can handle Black Friday traffic spikes.',
        followUp: ['How would you handle inventory consistency?', 'What about payment processing and order fulfillment?'],
        timeLimit: 480
      },
      {
        id: 'ec-be-2',
        type: 'technical',
        difficulty: 'hard',
        question: 'How would you implement a product recommendation engine that scales to millions of users?',
        followUp: ['What algorithms would you use?', 'How do you handle real-time vs batch processing?'],
        timeLimit: 360
      },
      {
        id: 'ec-be-3',
        type: 'situational',
        difficulty: 'hard',
        question: 'During a major sale, your database is experiencing deadlocks. How would you diagnose and resolve this?',
        followUp: ['What monitoring would you have in place?', 'How would you prevent this in the future?'],
        timeLimit: 300
      }
    ]
  },
  {
    id: 'edtech-product-mid',
    name: 'EdTech Product Manager - Mid Level',
    description: 'EdTech product management interview focusing on learning outcomes, user engagement, and educational impact',
    role: 'Product Manager',
    industry: 'education',
    category: 'behavioral',
    difficulty: 'medium',
    duration: 60,
    seniority: 'mid',
    questions: [
      {
        id: 'ed-pm-1',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'How do you measure the success of an educational product beyond traditional business metrics?',
        followUp: ['What learning metrics do you track?', 'How do you balance educational outcomes with user engagement?'],
        timeLimit: 240
      },
      {
        id: 'ed-pm-2',
        type: 'situational',
        difficulty: 'medium',
        question: 'Teachers are complaining that your product is too complex to use. How would you address this feedback?',
        followUp: ['How would you gather more specific feedback?', 'What trade-offs would you consider?'],
        timeLimit: 300
      },
      {
        id: 'ed-pm-3',
        type: 'behavioral',
        difficulty: 'medium',
        question: 'Tell me about a time you had to work with subject matter experts (teachers, professors) to build a product.',
        followUp: ['How did you bridge the gap between technical and educational expertise?', 'What challenges did you face?'],
        timeLimit: 180
      }
    ]
  },
  {
    id: 'automotive-embedded-senior',
    name: 'Automotive Embedded Engineer - Senior Level',
    description: 'Senior automotive engineering interview covering embedded systems, safety protocols, and connected vehicle technology',
    role: 'Senior Embedded Engineer',
    industry: 'automotive',
    category: 'technical',
    difficulty: 'hard',
    duration: 80,
    seniority: 'senior',
    questions: [
      {
        id: 'auto-emb-1',
        type: 'technical',
        difficulty: 'hard',
        question: 'Design an over-the-air (OTA) update system for vehicle firmware. How do you ensure safety and reliability?',
        followUp: ['What failsafe mechanisms would you implement?', 'How do you handle update failures?'],
        timeLimit: 480
      },
      {
        id: 'auto-emb-2',
        type: 'technical',
        difficulty: 'hard',
        question: 'How would you implement a CAN bus communication system for autonomous vehicle sensors?',
        followUp: ['What protocols would you use?', 'How do you ensure real-time performance and safety?'],
        timeLimit: 360
      },
      {
        id: 'auto-emb-3',
        type: 'situational',
        difficulty: 'hard',
        question: 'A critical safety-related bug is discovered in production vehicles. How would you handle this situation?',
        followUp: ['What communication protocols would you follow?', 'How do you coordinate with regulatory bodies?'],
        timeLimit: 300
      }
    ]
  }
]

// Helper function to get template by id
export function getTemplateById(id: string): InterviewTemplate | undefined {
  return interviewTemplates.find(template => template.id === id)
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: 'technical' | 'behavioral' | 'mixed'): InterviewTemplate[] {
  return interviewTemplates.filter(template => template.category === category)
}

// Helper function to get templates by difficulty
export function getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): InterviewTemplate[] {
  return interviewTemplates.filter(template => template.difficulty === difficulty)
}

// Helper function to get templates by role
export function getTemplatesByRole(role: string): InterviewTemplate[] {
  return interviewTemplates.filter(template => 
    template.role.toLowerCase().includes(role.toLowerCase()) || 
    template.role === 'General'
  )
}

// Helper function to get templates by industry
export function getTemplatesByIndustry(industry: string): InterviewTemplate[] {
  return interviewTemplates.filter(template => template.industry === industry)
}

// Helper function to get templates by seniority
export function getTemplatesBySeniority(seniority: 'entry' | 'mid' | 'senior'): InterviewTemplate[] {
  return interviewTemplates.filter(template => template.seniority === seniority)
}

// Helper function to get all industries that have templates
export function getAvailableIndustries(): string[] {
  const industries = new Set<string>()
  interviewTemplates.forEach(template => {
    if (template.industry) {
      industries.add(template.industry)
    }
  })
  return Array.from(industries)
}
