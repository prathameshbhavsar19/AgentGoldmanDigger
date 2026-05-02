import { describe, it, expect } from 'vitest'
import { customerDetailsSchema, reviewConsentSchema, followUpSchema } from '../validators'

describe('customerDetailsSchema', () => {
  const valid = {
    firstName: 'Priya', country: 'US', ageRange: '18-24',
    employmentStatus: 'full-time', currency: 'USD', primaryConcern: 'start-safely',
  }

  it('passes with valid data', () => {
    expect(customerDetailsSchema.safeParse(valid).success).toBe(true)
  })

  it('fails when firstName is empty', () => {
    const result = customerDetailsSchema.safeParse({ ...valid, firstName: '' })
    expect(result.success).toBe(false)
  })

  it('fails when email is invalid', () => {
    const result = customerDetailsSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('passes when email is empty (optional)', () => {
    const result = customerDetailsSchema.safeParse({ ...valid, email: '' })
    expect(result.success).toBe(true)
  })
})

describe('reviewConsentSchema', () => {
  it('passes with consent = true', () => {
    expect(reviewConsentSchema.safeParse({ consent: true }).success).toBe(true)
  })

  it('fails with consent = false', () => {
    expect(reviewConsentSchema.safeParse({ consent: false }).success).toBe(false)
  })
})

describe('followUpSchema', () => {
  it('passes with valid question', () => {
    expect(followUpSchema.safeParse({ question: 'Make this more conservative' }).success).toBe(true)
  })

  it('fails with short question', () => {
    expect(followUpSchema.safeParse({ question: 'Hi' }).success).toBe(false)
  })

  it('fails with empty question', () => {
    expect(followUpSchema.safeParse({ question: '' }).success).toBe(false)
  })
})
