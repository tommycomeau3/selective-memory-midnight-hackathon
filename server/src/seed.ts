import type { Agent, Memory, MemoryCategory } from './types.js';

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  health: 'Health',
  career: 'Career',
  finance: 'Finance',
  personal: 'Personal',
};

export const agents: Agent[] = [
  {
    id: 'health',
    name: 'Health Agent',
    description: 'Wellness, fitness, and medical context only.',
    allowedCategories: ['health'],
    blockedCategories: ['career', 'finance', 'personal'],
    icon: 'heart-pulse',
  },
  {
    id: 'career',
    name: 'Career Agent',
    description: 'Professional growth, roles, and workplace context only.',
    allowedCategories: ['career'],
    blockedCategories: ['health', 'finance', 'personal'],
    icon: 'briefcase',
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    description: 'Budgets, debt, and investments only.',
    allowedCategories: ['finance'],
    blockedCategories: ['health', 'career', 'personal'],
    icon: 'wallet',
  },
  {
    id: 'personal',
    name: 'Personal Agent',
    description: 'Hobbies, relationships, and private journal entries.',
    allowedCategories: ['personal'],
    blockedCategories: ['health', 'career', 'finance'],
    icon: 'user',
  },
];

export const memories: Memory[] = [
  {
    id: 'mem-career-1',
    title: 'Current Role at Acme Corp',
    content:
      'Senior software engineer on the platform team. Leading migration to microservices. Strong performance reviews for two consecutive years.',
    category: 'career',
  },
  {
    id: 'mem-career-2',
    title: 'Promotion Track',
    content:
      'In discussions for Staff Engineer role. Manager indicated decision by Q3. Preparing architecture doc for review committee.',
    category: 'career',
  },
  {
    id: 'mem-career-3',
    title: 'Salary Negotiation Anxiety',
    content:
      'Worried about asking for 15% raise during promotion cycle. Comparing offers from recruiters but prefer to stay at Acme.',
    category: 'career',
  },
  {
    id: 'mem-health-1',
    title: 'Therapy Sessions',
    content:
      'Weekly CBT sessions for anxiety management. Therapist recommended journaling and breathing exercises.',
    category: 'health',
  },
  {
    id: 'mem-health-2',
    title: 'Fitness Routine',
    content:
      'Running 3x per week, strength training 2x. Training for a half marathon in October.',
    category: 'health',
  },
  {
    id: 'mem-health-3',
    title: 'Medication',
    content:
      'Low-dose SSRI prescribed for generalized anxiety. Started 4 months ago with noticeable improvement in sleep.',
    category: 'health',
  },
  {
    id: 'mem-finance-1',
    title: 'Student Loan Balance',
    content:
      'Remaining student debt approximately $42,000 at 4.8% APR. On income-driven repayment plan.',
    category: 'finance',
  },
  {
    id: 'mem-finance-2',
    title: 'Emergency Fund',
    content:
      'Saved 4 months of expenses in high-yield savings. Goal is 6 months by end of year.',
    category: 'finance',
  },
  {
    id: 'mem-finance-3',
    title: 'Investment Portfolio',
    content:
      '401k at 12% contribution with employer match. Roth IRA maxed last year. Index funds across US, international, and bonds.',
    category: 'finance',
  },
  {
    id: 'mem-personal-1',
    title: 'Hobbies & Interests',
    content:
      'Loves hiking, cooking Italian food, and playing acoustic guitar. Volunteers at animal shelter monthly.',
    category: 'personal',
  },
  {
    id: 'mem-personal-2',
    title: 'Relationship Goals',
    content:
      'Looking for a long-term committed relationship. Values honesty, humor, and shared outdoor activities.',
    category: 'personal',
  },
  {
    id: 'mem-personal-3',
    title: 'Personality Reflection',
    content:
      'Considers themselves an introvert who recharges outdoors. Friends describe them as thoughtful and loyal.',
    category: 'personal',
  },
];

export function getAgent(agentId: string) {
  return agents.find((a) => a.id === agentId);
}
