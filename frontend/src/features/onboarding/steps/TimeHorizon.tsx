import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const HORIZONS = [
  { value: 'under-6m',  label: 'Less than 6 months',    desc: 'Short-term goal — focus on capital preservation.' },
  { value: '6m-1y',     label: '6 months to 1 year',    desc: 'Near-term goal — low-risk options preferred.' },
  { value: '1-3y',      label: '1–3 years',             desc: 'Balanced approach with some growth potential.' },
  { value: '3-5y',      label: '3–5 years',             desc: 'Medium-term — moderate equity exposure is suitable.' },
  { value: '5-10y',     label: '5–10 years',            desc: 'Long-term — good foundation for equity investing.' },
  { value: '10-plus',   label: 'More than 10 years',    desc: 'Best position for long-term compounding growth.' },
  { value: 'not-sure',  label: 'I am not sure',         desc: 'We will help you work this out.' },
]

export default function TimeHorizonStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [horizon, setHorizon] = useState(store.horizon)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!horizon) { setError('Please select a time horizon.'); return }
    store.patch({ horizon })
    await save({ horizon })
    store.nextStep()
  }

  return (
    <StepShell title="When do you expect to need this money?" subtitle="This helps us match your strategy to your timeline." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Time horizon" className="flex flex-col gap-2">
        {HORIZONS.map(h => (
          <OptionCard key={h.value} value={h.value} label={h.label} description={h.desc} selected={horizon === h.value} onClick={() => { setHorizon(h.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
