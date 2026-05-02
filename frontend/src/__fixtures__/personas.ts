import type { Currency } from '../lib/currency'

export interface Persona {
  id: string
  displayName: string
  // customer details
  firstName: string
  lastName: string
  email: string
  country: string
  ageRange: string
  employmentStatus: string
  incomeRange: string
  currency: Currency
  primaryConcern: string
  // onboarding
  goal: string
  horizon: string
  capacity: string
  savings: string
  riskReaction: string
  familiarity: string
  investmentStatus: string
  portfolioMethod: string
  portfolioReviewIntent: string
  // expected tone
  tone: 'encouraging' | 'explanatory' | 'analytical'
}

export const newInvestor: Persona = {
  id: 'newInvestor',
  displayName: 'Priya S.',
  firstName: 'Priya',
  lastName: 'Shah',
  email: 'priya@example.com',
  country: 'US',
  ageRange: '18-24',
  employmentStatus: 'full-time',
  incomeRange: '30000-60000',
  currency: 'USD',
  primaryConcern: 'start-safely',
  goal: 'wealth-creation',
  horizon: '10-plus',
  capacity: '50-250',
  savings: '1-3-months',
  riskReaction: 'review-decide',
  familiarity: 'never-invested',
  investmentStatus: 'no-investments',
  portfolioMethod: '',
  portfolioReviewIntent: '',
  tone: 'encouraging',
}

export const balancedExisting: Persona = {
  id: 'balancedExisting',
  displayName: 'Marcus T.',
  firstName: 'Marcus',
  lastName: 'Torres',
  email: 'marcus@example.com',
  country: 'US',
  ageRange: '35-44',
  employmentStatus: 'full-time',
  incomeRange: '90000-150000',
  currency: 'USD',
  primaryConcern: 'understand-portfolio',
  goal: 'retirement',
  horizon: '5-10',
  capacity: '750-2000',
  savings: '3-6-months',
  riskReaction: 'hold',
  familiarity: 'choose-some',
  investmentStatus: 'stocks-and-funds',
  portfolioMethod: 'manual',
  portfolioReviewIntent: 'check-goal-match',
  tone: 'explanatory',
}

export const experienced: Persona = {
  id: 'experienced',
  displayName: 'Sandra L.',
  firstName: 'Sandra',
  lastName: 'Liu',
  email: 'sandra@example.com',
  country: 'US',
  ageRange: '45-54',
  employmentStatus: 'business-owner',
  incomeRange: '150000-plus',
  currency: 'USD',
  primaryConcern: 'reduce-risk',
  goal: 'financial-freedom',
  horizon: '5-10',
  capacity: '>2000',
  savings: '6-months-plus',
  riskReaction: 'invest-more',
  familiarity: 'rebalance-compare',
  investmentStatus: 'mixed-assets',
  portfolioMethod: 'csv',
  portfolioReviewIntent: 'rebalance',
  tone: 'analytical',
}

export const ALL_PERSONAS = [newInvestor, balancedExisting, experienced]
