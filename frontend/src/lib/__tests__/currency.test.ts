import { describe, it, expect } from 'vitest'
import { formatCurrency, getCapacityBuckets } from '../currency'

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(1500, 'USD')).toBe('$1,500')
  })

  it('formats INR', () => {
    const result = formatCurrency(50000, 'INR')
    expect(result).toContain('₹')
    expect(result).toContain('50')
  })

  it('formats GBP', () => {
    expect(formatCurrency(1000, 'GBP')).toContain('£')
  })
})

describe('getCapacityBuckets', () => {
  it('returns USD buckets for USD currency', () => {
    const buckets = getCapacityBuckets('USD')
    expect(buckets.length).toBeGreaterThan(0)
    expect(buckets[0].label).toContain('$')
  })

  it('returns INR buckets for INR currency', () => {
    const buckets = getCapacityBuckets('INR')
    expect(buckets[0].label).toContain('₹')
  })

  it('returns GBP buckets for GBP currency', () => {
    const buckets = getCapacityBuckets('GBP')
    expect(buckets[0].label).toContain('£')
  })

  it('always includes a variable option', () => {
    const buckets = getCapacityBuckets('USD')
    expect(buckets.some(b => b.value === 'variable')).toBe(true)
  })
})
