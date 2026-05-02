import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerDetailsSchema, type CustomerDetails } from '../../../lib/validators'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import Field from '../../../components/ui/Field'
import SelectField from '../../../components/ui/SelectField'

const COUNTRIES = [
  { value: 'US', label: 'United States' }, { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' }, { value: 'DE', label: 'Germany' },
  { value: 'AU', label: 'Australia' }, { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' }, { value: 'AE', label: 'UAE' },
]
const AGE_RANGES = [
  { value: 'under-18', label: 'Under 18' }, { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' }, { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' }, { value: '55-64', label: '55–64' },
  { value: '65-plus', label: '65+' }, { value: 'prefer-not', label: 'Prefer not to say' },
]
const EMPLOYMENT = [
  { value: 'student', label: 'Student' }, { value: 'full-time', label: 'Full-time employed' },
  { value: 'part-time', label: 'Part-time employed' }, { value: 'self-employed', label: 'Self-employed' },
  { value: 'business-owner', label: 'Business owner' }, { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' }, { value: 'prefer-not', label: 'Prefer not to say' },
]
const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' }, { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'GBP', label: 'GBP — British Pound' }, { value: 'EUR', label: 'EUR — Euro' },
]
const CONCERNS = [
  { value: 'start-safely',         label: 'I want to start investing safely' },
  { value: 'grow-wealth',          label: 'I want to grow my wealth' },
  { value: 'understand-portfolio', label: 'I want to understand my current portfolio' },
  { value: 'reduce-risk',          label: 'I want to reduce portfolio risk' },
  { value: 'major-goal',           label: 'I want to prepare for a major life goal' },
  { value: 'unsure',               label: 'I am unsure where to begin' },
]

export default function CustomerDetailsStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: {
      firstName: store.firstName, lastName: store.lastName, email: store.email,
      country: store.country, ageRange: store.ageRange, employmentStatus: store.employmentStatus,
      incomeRange: store.incomeRange, currency: store.currency, primaryConcern: store.primaryConcern,
    },
  })

  const onSubmit = async (data: CustomerDetails) => {
    store.patch(data)
    await save(data)
    store.nextStep()
  }

  return (
    <StepShell title="Let's get to know you first." subtitle="We'll use this to personalise your portfolio guidance." onSubmit={handleSubmit(onSubmit)} hideback>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="First name" required error={errors.firstName?.message} {...register('firstName')} />
        <Field label="Last name" error={errors.lastName?.message} {...register('lastName')} />
      </div>
      <Field label="Email" type="email" error={errors.email?.message} {...register('email')} hint="Optional — needed only if you want to save your report." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Country / market" required options={COUNTRIES} placeholder="Select country" error={errors.country?.message} {...register('country')} />
        <SelectField label="Age range" required options={AGE_RANGES} placeholder="Select age range" error={errors.ageRange?.message} {...register('ageRange')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Employment status" required options={EMPLOYMENT} placeholder="Select status" error={errors.employmentStatus?.message} {...register('employmentStatus')} />
        <SelectField label="Preferred currency" required options={CURRENCIES} placeholder="Select currency" error={errors.currency?.message} {...register('currency')} />
      </div>
      <SelectField label="What is your primary financial concern?" required options={CONCERNS} placeholder="Select concern" error={errors.primaryConcern?.message} {...register('primaryConcern')} />
    </StepShell>
  )
}
