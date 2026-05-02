import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'
import { getCapacityBuckets, type Currency } from '../../../lib/currency'

export default function MonthlyCapacityStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [capacity, setCapacity] = useState(store.capacity)
  const [error, setError] = useState('')
  const buckets = getCapacityBuckets((store.currency as Currency) || 'USD')

  const handleSubmit = async () => {
    if (!capacity) { setError('Please select an amount.'); return }
    store.patch({ capacity })
    await save({ capacity })
    store.nextStep()
  }

  return (
    <StepShell title="How much can you comfortably invest each month?" subtitle="Choose an amount you can invest without affecting rent, bills, or emergency needs." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Monthly investment capacity" className="flex flex-col gap-2">
        {buckets.map(b => (
          <OptionCard key={b.value} value={b.value} label={b.label} selected={capacity === b.value} onClick={() => { setCapacity(b.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
