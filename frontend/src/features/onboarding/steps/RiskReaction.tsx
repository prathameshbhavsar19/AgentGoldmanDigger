import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const OPTIONS = [
  { value: 'sell-everything', label: 'Sell everything immediately',          desc: 'Capital safety is the top priority.' },
  { value: 'stop-investing',  label: 'Stop investing and wait',              desc: 'Pause until things become clearer.' },
  { value: 'hold',            label: 'Feel stressed but hold on',            desc: 'Uncomfortable, but you trust the long term.' },
  { value: 'move-safer',      label: 'Move some money to safer options',     desc: 'Partial defensive shift.' },
  { value: 'review-decide',   label: 'Review the reason and then decide',    desc: 'Evidence-based decision making.' },
  { value: 'continue',        label: 'Continue investing as planned',        desc: 'Comfortable with short-term fluctuations.' },
  { value: 'invest-more',     label: 'Invest more — see it as an opportunity', desc: 'Experienced investor mindset.' },
  { value: 'not-sure',        label: 'I am not sure',                        desc: 'We will help you understand your comfort level.' },
]

export default function RiskReactionStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [reaction, setReaction] = useState(store.riskReaction)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reaction) { setError('Please select a reaction.'); return }
    store.patch({ riskReaction: reaction })
    await save({ riskReaction: reaction })
    store.nextStep()
  }

  return (
    <StepShell title="If your investment dropped by 15% in one month, what would you most likely do?" subtitle="There is no right or wrong answer. This helps us calibrate your strategy to your comfort level." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Risk reaction" className="flex flex-col gap-2">
        {OPTIONS.map(o => (
          <OptionCard key={o.value} value={o.value} label={o.label} description={o.desc} selected={reaction === o.value} onClick={() => { setReaction(o.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
