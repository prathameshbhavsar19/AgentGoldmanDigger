import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const OPTIONS = [
  { value: 'none',          label: 'No emergency savings yet',     desc: "That's okay — building your buffer is a great first step." },
  { value: 'under-1m',      label: 'Less than 1 month of expenses', desc: 'A small buffer — investing small amounts while building more is wise.' },
  { value: '1-3-months',    label: '1–3 months of expenses',       desc: 'A reasonable start — you can begin investing cautiously.' },
  { value: '3-6-months',    label: '3–6 months of expenses',       desc: 'Good foundation — ready for a balanced investment approach.' },
  { value: '6-months-plus', label: 'More than 6 months',           desc: 'Excellent buffer — you have the freedom for a growth-oriented strategy.' },
  { value: 'not-sure',      label: 'I am not sure',                desc: 'We will help you estimate this.' },
]

export default function EmergencySavingsStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [savings, setSavings] = useState(store.savings)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!savings) { setError('Please select an option.'); return }
    store.patch({ savings })
    await save({ savings })
    store.nextStep()
  }

  return (
    <StepShell title="How much emergency savings do you currently have?" subtitle="Emergency savings protect you from having to sell investments during a crisis." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Emergency savings" className="flex flex-col gap-2">
        {OPTIONS.map(o => (
          <OptionCard key={o.value} value={o.value} label={o.label} description={o.desc} selected={savings === o.value} onClick={() => { setSavings(o.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
