import type { InterviewQuestion } from "@/types/interview"

export interface InterviewTemplate {
  id: string
  name: string
  description: string
  role: string
  category: 'technical' | 'behavioral' | 'mixed'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number // in minutes
  questions: InterviewQuestion[]
}

export const interviewTemplates: InterviewTemplate[] = [
  {
    id: 'frontend-engineer-basic',
    name: 'Frontend Engineer - Entry Level',
    description: 'Basic frontend development interview focusing on HTML, CSS, JavaScript fundamentals',
    role: 'Frontend Engineer',
    category: 'technical',
    difficulty: 'easy',
    duration: 45,
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
    category: 'technical',
    difficulty: 'medium',
    duration: 60,
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
    category: 'mixed',
    difficulty: 'hard',
    duration: 90,
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
    category: 'behavioral',
    difficulty: 'medium',
    duration: 60,
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
    category: 'technical',
    difficulty: 'medium',
    duration: 75,
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
    category: 'technical',
    difficulty: 'hard',
    duration: 60,
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
