import { z } from 'zod'

// ── Customer details ──────────────────────────────────────
export const customerDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName:  z.string().max(60).optional(),
  email:     z.string().email('Enter a valid email').optional().or(z.literal('')),
  country:   z.string().min(1, 'Please select a country'),
  ageRange:  z.string().min(1, 'Please select your age range'),
  employmentStatus: z.string().min(1, 'Please select your employment status'),
  incomeRange: z.string().optional(),
  currency:  z.string().min(1, 'Please select a currency'),
  primaryConcern: z.string().min(1, 'Please select your primary concern'),
})
export type CustomerDetails = z.infer<typeof customerDetailsSchema>

// ── Investment goal ───────────────────────────────────────
export const investmentGoalSchema = z.object({
  goal: z.string().min(1, 'Please select an investment goal'),
})
export type InvestmentGoal = z.infer<typeof investmentGoalSchema>

// ── Time horizon ─────────────────────────────────────────
export const timeHorizonSchema = z.object({
  horizon: z.string().min(1, 'Please select a time horizon'),
})
export type TimeHorizon = z.infer<typeof timeHorizonSchema>

// ── Monthly capacity ──────────────────────────────────────
export const monthlyCapacitySchema = z.object({
  capacity: z.string().min(1, 'Please select an amount'),
})
export type MonthlyCapacity = z.infer<typeof monthlyCapacitySchema>

// ── Emergency savings ─────────────────────────────────────
export const emergencySavingsSchema = z.object({
  savings: z.string().min(1, 'Please select an option'),
})
export type EmergencySavings = z.infer<typeof emergencySavingsSchema>

// ── Risk reaction ─────────────────────────────────────────
export const riskReactionSchema = z.object({
  reaction: z.string().min(1, 'Please select a reaction'),
})
export type RiskReaction = z.infer<typeof riskReactionSchema>

// ── Investment familiarity ────────────────────────────────
export const investmentFamiliaritySchema = z.object({
  familiarity: z.string().min(1, 'Please select an option'),
})
export type InvestmentFamiliarity = z.infer<typeof investmentFamiliaritySchema>

// ── Investment status ─────────────────────────────────────
export const investmentStatusSchema = z.object({
  status: z.string().min(1, 'Please select an option'),
})
export type InvestmentStatus = z.infer<typeof investmentStatusSchema>

// ── Portfolio review intent ───────────────────────────────
export const portfolioReviewIntentSchema = z.object({
  intent: z.string().min(1, 'Please select what you want help with'),
})
export type PortfolioReviewIntent = z.infer<typeof portfolioReviewIntentSchema>

// ── Consent ───────────────────────────────────────────────
export const reviewConsentSchema = z.object({
  consent: z.literal(true, { error: 'You must accept to continue' }),
})
export type ReviewConsent = z.infer<typeof reviewConsentSchema>

// ── Follow-up ─────────────────────────────────────────────
export const followUpSchema = z.object({
  question: z.string().min(3, 'Please enter a question').max(500),
})
export type FollowUp = z.infer<typeof followUpSchema>
