export type Currency = 'USD' | 'INR' | 'GBP' | 'EUR'

const LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  GBP: 'en-GB',
  EUR: 'de-DE',
}

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export interface CapacityBucket {
  label: string
  value: string
  min: number | null
  max: number | null
}

const BUCKETS: Record<Currency, CapacityBucket[]> = {
  USD: [
    { label: 'Less than $50',        value: '<50',       min: null, max: 50 },
    { label: '$50 – $250',           value: '50-250',    min: 50,   max: 250 },
    { label: '$250 – $750',          value: '250-750',   min: 250,  max: 750 },
    { label: '$750 – $2,000',        value: '750-2000',  min: 750,  max: 2000 },
    { label: 'More than $2,000',     value: '>2000',     min: 2000, max: null },
    { label: 'It changes every month', value: 'variable', min: null, max: null },
    { label: 'I prefer one-time investing', value: 'lump-sum', min: null, max: null },
  ],
  INR: [
    { label: 'Less than ₹1,000',        value: '<1000',       min: null, max: 1000 },
    { label: '₹1,000 – ₹5,000',         value: '1000-5000',   min: 1000, max: 5000 },
    { label: '₹5,000 – ₹15,000',        value: '5000-15000',  min: 5000, max: 15000 },
    { label: '₹15,000 – ₹50,000',       value: '15000-50000', min: 15000, max: 50000 },
    { label: 'More than ₹50,000',        value: '>50000',      min: 50000, max: null },
    { label: 'It changes every month',   value: 'variable',    min: null,  max: null },
    { label: 'I prefer one-time investing', value: 'lump-sum', min: null,  max: null },
  ],
  GBP: [
    { label: 'Less than £50',        value: '<50',       min: null, max: 50 },
    { label: '£50 – £200',           value: '50-200',    min: 50,   max: 200 },
    { label: '£200 – £600',          value: '200-600',   min: 200,  max: 600 },
    { label: '£600 – £1,500',        value: '600-1500',  min: 600,  max: 1500 },
    { label: 'More than £1,500',     value: '>1500',     min: 1500, max: null },
    { label: 'It changes every month', value: 'variable', min: null, max: null },
    { label: 'I prefer one-time investing', value: 'lump-sum', min: null, max: null },
  ],
  EUR: [
    { label: 'Less than €50',        value: '<50',       min: null, max: 50 },
    { label: '€50 – €250',           value: '50-250',    min: 50,   max: 250 },
    { label: '€250 – €750',          value: '250-750',   min: 250,  max: 750 },
    { label: '€750 – €2,000',        value: '750-2000',  min: 750,  max: 2000 },
    { label: 'More than €2,000',     value: '>2000',     min: 2000, max: null },
    { label: 'It changes every month', value: 'variable', min: null, max: null },
    { label: 'I prefer one-time investing', value: 'lump-sum', min: null, max: null },
  ],
}

export function getCapacityBuckets(currency: Currency): CapacityBucket[] {
  return BUCKETS[currency] ?? BUCKETS.USD
}
