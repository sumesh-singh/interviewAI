import type { InterviewQuestion } from "@/types/interview"

export const mockQuestions: InterviewQuestion[] = [
  {
    id: "1",
    type: "behavioral",
    difficulty: "medium",
    question:
      "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
    followUp: ["What would you do differently?", "How did this experience change your approach to teamwork?"],
    timeLimit: 180,
  },
  {
    id: "2",
    type: "technical",
    difficulty: "medium",
    question: "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?",
    followUp: ["Can you give an example of when GraphQL would be preferred?"],
    timeLimit: 240,
  },
  {
    id: "3",
    type: "situational",
    difficulty: "hard",
    question:
      "You're leading a project that's behind schedule and over budget. The client is demanding delivery by the original deadline. How do you handle this situation?",
    followUp: [
      "How would you communicate this to stakeholders?",
      "What steps would you take to prevent this in future projects?",
    ],
    timeLimit: 300,
  },
  {
    id: "4",
    type: "behavioral",
    difficulty: "easy",
    question: "Describe a project you're particularly proud of. What made it successful?",
    followUp: ["What challenges did you face?", "What did you learn from this project?"],
    timeLimit: 180,
  },
  {
    id: "5",
    type: "technical",
    difficulty: "hard",
    question:
      "How would you design a system to handle 1 million concurrent users? Walk me through your architecture decisions.",
    followUp: ["How would you handle database scaling?", "What about caching strategies?"],
    timeLimit: 360,
  },
]
