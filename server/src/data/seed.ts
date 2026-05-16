import type { Agent, Memory } from '../types.js';

function maskPreview(content: string): string {
  const words = content.split(/\s+/).slice(0, 8);
  return words.map((w) => '•'.repeat(Math.min(w.length, 6))).join(' ') + ' •••';
}

export const agents: Agent[] = [
  {
    id: 'career',
    name: 'Career Agent',
    description: 'Professional growth, roles, and workplace context only.',
    allowedCategories: ['career'],
    blockedCategories: ['health', 'finance', 'dating', 'journal'],
    icon: 'briefcase',
  },
  {
    id: 'health',
    name: 'Health Agent',
    description: 'Wellness, fitness, and medical context only.',
    allowedCategories: ['health'],
    blockedCategories: ['career', 'finance', 'dating', 'journal'],
    icon: 'heart-pulse',
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    description: 'Budgets, debt, and investments only.',
    allowedCategories: ['finance'],
    blockedCategories: ['health', 'career', 'dating', 'journal'],
    icon: 'wallet',
  },
  {
    id: 'dating',
    name: 'Dating Agent',
    description: 'Relationship goals, hobbies, and personality — never clinical or financial data.',
    allowedCategories: ['dating', 'journal'],
    blockedCategories: ['health', 'career', 'finance'],
    icon: 'heart',
  },
];

const rawMemories: Omit<Memory, 'preview'>[] = [
  {
    id: 'mem-career-1',
    title: 'Current Role at Acme Corp',
    content:
      'Senior software engineer on the platform team. Leading migration to microservices. Strong performance reviews for two consecutive years.',
    category: 'career',
    sensitivity: 'medium',
  },
  {
    id: 'mem-career-2',
    title: 'Promotion Track',
    content:
      'In discussions for Staff Engineer role. Manager indicated decision by Q3. Preparing architecture doc for review committee.',
    category: 'career',
    sensitivity: 'medium',
  },
  {
    id: 'mem-career-3',
    title: 'Salary Negotiation Anxiety',
    content:
      'Worried about asking for 15% raise during promotion cycle. Comparing offers from recruiters but prefer to stay at Acme.',
    category: 'career',
    sensitivity: 'high',
  },
  {
    id: 'mem-health-1',
    title: 'Therapy Sessions',
    content:
      'Weekly CBT sessions for anxiety management. Therapist recommended journaling and breathing exercises.',
    category: 'health',
    sensitivity: 'high',
  },
  {
    id: 'mem-health-2',
    title: 'Fitness Routine',
    content:
      'Running 3x per week, strength training 2x. Training for a half marathon in October. Resting heart rate improving.',
    category: 'health',
    sensitivity: 'low',
  },
  {
    id: 'mem-health-3',
    title: 'Medication',
    content:
      'Low-dose SSRI prescribed for generalized anxiety. Started 4 months ago with noticeable improvement in sleep.',
    category: 'health',
    sensitivity: 'high',
  },
  {
    id: 'mem-finance-1',
    title: 'Student Loan Balance',
    content:
      'Remaining student debt approximately $42,000 at 4.8% APR. On income-driven repayment plan. Extra $200/month toward principal.',
    category: 'finance',
    sensitivity: 'high',
  },
  {
    id: 'mem-finance-2',
    title: 'Emergency Fund',
    content:
      'Saved 4 months of expenses in high-yield savings. Goal is 6 months by end of year.',
    category: 'finance',
    sensitivity: 'medium',
  },
  {
    id: 'mem-finance-3',
    title: 'Investment Portfolio',
    content:
      '401k at 12% contribution with employer match. Roth IRA maxed last year. Index funds: 70% US, 20% international, 10% bonds.',
    category: 'finance',
    sensitivity: 'medium',
  },
  {
    id: 'mem-dating-1',
    title: 'Hobbies & Interests',
    content:
      'Loves hiking on weekends, cooking Italian food, and playing acoustic guitar. Volunteers at animal shelter monthly.',
    category: 'dating',
    sensitivity: 'low',
  },
  {
    id: 'mem-dating-2',
    title: 'Relationship Goals',
    content:
      'Looking for a long-term committed relationship. Values honesty, humor, and shared outdoor activities.',
    category: 'dating',
    sensitivity: 'medium',
  },
  {
    id: 'mem-dating-3',
    title: 'Dating App Preferences',
    content:
      'Active on two apps but selective about matches. Prefers coffee dates before dinner. Deal-breaker: smoking.',
    category: 'dating',
    sensitivity: 'medium',
  },
  {
    id: 'mem-journal-1',
    title: 'Personality Reflection',
    content:
      'I consider myself an introvert who recharges outdoors. Friends describe me as thoughtful and loyal. I open up slowly but deeply.',
    category: 'journal',
    sensitivity: 'medium',
  },
  {
    id: 'mem-journal-2',
    title: 'Private Diary Entry',
    content:
      'Some days the anxiety feels overwhelming despite progress. Grateful for therapy but scared to share this at work.',
    category: 'journal',
    sensitivity: 'high',
  },
];

export const memories: Memory[] = rawMemories.map((m) => ({
  ...m,
  preview: maskPreview(m.content),
}));

export function getAgentById(agentId: string): Agent | undefined {
  return agents.find((a) => a.id === agentId);
}

export function getMemoryById(memoryId: string): Memory | undefined {
  return memories.find((m) => m.id === memoryId);
}
