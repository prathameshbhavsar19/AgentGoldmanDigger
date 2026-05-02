import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const GOALS = [
  { value: 'emergency-fund',   label: 'Emergency fund',       desc: 'Build 3–6 months of expenses in a safe account.' },
  { value: 'travel-purchase',  label: 'Travel or lifestyle',   desc: 'Save for a trip, vehicle, or major purchase.' },
  { value: 'wedding-event',    label: 'Wedding or family event', desc: 'Plan for an upcoming life event.' },
  { value: 'buy-home',         label: 'Buying a home',         desc: 'Save for a down payment or property.' },
  { value: 'education',        label: 'Higher education',      desc: "Fund your own or a family member's education." },
  { value: 'start-business',   label: 'Starting a business',   desc: 'Build capital to launch or grow a venture.' },
  { value: 'wealth-creation',  label: 'Wealth creation',       desc: 'Grow net worth over the long term.' },
  { value: 'retirement',       label: 'Retirement',            desc: 'Build a comfortable nest egg for later life.' },
  { value: 'child-education',  label: "Child's education",     desc: "Invest for your child's future education costs." },
  { value: 'financial-freedom', label: 'Financial freedom',    desc: 'Reach a point where work becomes optional.' },
  { value: 'unsure',           label: 'I am not sure yet',     desc: "That's fine — we'll help you figure it out." },
]

export default function InvestmentGoalStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [goal, setGoal] = useState(store.goal)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!goal) { setError('Please select an investment goal.'); return }
    store.patch({ goal })
    await save({ goal })
    store.nextStep()
  }

  return (
    <StepShell title="What are you investing for?" subtitle="Select your primary goal. You can always refine this later." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Investment goal" className="flex flex-col gap-2">
        {GOALS.map(g => (
          <OptionCard key={g.value} value={g.value} label={g.label} description={g.desc} selected={goal === g.value} onClick={() => { setGoal(g.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
