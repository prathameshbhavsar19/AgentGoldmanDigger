import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const OPTIONS = [
  { value: 'never-invested',    label: 'I have never invested before',           desc: 'Starting from zero is perfectly fine.' },
  { value: 'know-terms',        label: 'I know a few terms but have not started', desc: 'Some awareness, no action yet.' },
  { value: 'via-advisor',       label: 'I invest through an advisor, family, or app', desc: 'Someone else makes the decisions.' },
  { value: 'choose-some',       label: 'I choose some investments myself',        desc: 'Actively involved to some degree.' },
  { value: 'track-review',      label: 'I actively track and review my portfolio', desc: 'Regular oversight and adjustment.' },
  { value: 'rebalance-compare', label: 'I rebalance or compare investments regularly', desc: 'Experienced, data-driven investor.' },
]

export default function InvestmentFamiliarityStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [familiarity, setFamiliarity] = useState(store.familiarity)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!familiarity) { setError('Please select an option.'); return }
    store.patch({ familiarity })
    await save({ familiarity })
    store.nextStep()
  }

  return (
    <StepShell title="How familiar are you with investing?" subtitle="This helps us choose the right level of detail for your strategy canvas." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Investment familiarity" className="flex flex-col gap-2">
        {OPTIONS.map(o => (
          <OptionCard key={o.value} value={o.value} label={o.label} description={o.desc} selected={familiarity === o.value} onClick={() => { setFamiliarity(o.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
