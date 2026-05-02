import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const OPTIONS = [
  { value: 'no-investments',   label: 'No, I have not invested yet',                desc: 'We will build a starter strategy for you.' },
  { value: 'mutual-funds',     label: 'Yes, mutual funds only',                     desc: '' },
  { value: 'stocks-only',      label: 'Yes, stocks only',                           desc: '' },
  { value: 'stocks-and-funds', label: 'Yes, both stocks and mutual funds',          desc: '' },
  { value: 'fixed-income',     label: 'Yes, fixed deposits, bonds, or retirement accounts', desc: '' },
  { value: 'mixed-assets',     label: 'Yes, gold, real estate, or other assets',   desc: '' },
  { value: 'not-sure',         label: 'I am not sure what I own',                  desc: 'We will help you figure it out.' },
  { value: 'managed',          label: 'Someone else manages it for me',             desc: '' },
]

const NO_PORTFOLIO_VALUES = ['no-investments']

export default function InvestmentStatusStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [status, setStatus] = useState(store.investmentStatus)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!status) { setError('Please select an option.'); return }
    store.patch({ investmentStatus: status })
    await save({ investmentStatus: status })
    if (NO_PORTFOLIO_VALUES.includes(status)) {
      store.setStep('review')
    } else {
      store.setStep('portfolio-method')
    }
  }

  return (
    <StepShell title="Do you currently own any investments?" subtitle="Be as accurate as you can — approximate is fine." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Investment status" className="flex flex-col gap-2">
        {OPTIONS.map(o => (
          <OptionCard key={o.value} value={o.value} label={o.label} description={o.desc || undefined} selected={status === o.value} onClick={() => { setStatus(o.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
