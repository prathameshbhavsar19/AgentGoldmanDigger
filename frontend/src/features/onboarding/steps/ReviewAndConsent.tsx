import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reviewConsentSchema, type ReviewConsent } from '../../../lib/validators'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { generateStrategy } from '../../../lib/api'
import { useCanvasStore } from '../../../stores/canvasStore'
import StepShell from '../StepShell'
import Card from '../../../components/ui/Card'
import { copy } from '../../../lib/copy'
import { Pencil } from 'lucide-react'

export default function ReviewAndConsentStep() {
  const store = useOnboardingStore()
  const canvasStore = useCanvasStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<ReviewConsent>({
    resolver: zodResolver(reviewConsentSchema),
    defaultValues: { consent: store.consentGiven || undefined },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => generateStrategy(store.sessionId!),
    onSuccess: ({ jobId }) => {
      canvasStore.setJobId(jobId)
      canvasStore.setUserName(store.firstName)
      navigate(`/canvas/${jobId}`)
    },
  })

  const onSubmit = () => {
    store.patch({ consentGiven: true })
    mutate()
  }

  const summaryItems = [
    { label: 'Name',                value: [store.firstName, store.lastName].filter(Boolean).join(' ') || '—' },
    { label: 'Goal',                value: store.goal || '—' },
    { label: 'Time horizon',        value: store.horizon || '—' },
    { label: 'Monthly investment',  value: store.capacity || '—' },
    { label: 'Emergency savings',   value: store.savings || '—' },
    { label: 'Risk reaction',       value: store.riskReaction || '—' },
    { label: 'Portfolio status',    value: store.investmentStatus || 'None' },
  ]

  return (
    <StepShell
      title="Ready to build your personalised portfolio view."
      subtitle="Review your answers before we start the analysis."
      onSubmit={handleSubmit(onSubmit)}
      submitting={isPending}
      ctaLabel={copy.canvas.ctaGenerate}
    >
      <Card padding="sm">
        <dl className="divide-y divide-[var(--border)]">
          {summaryItems.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 gap-3">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="text-sm font-medium text-ink capitalize text-right">{String(value).replace(/-/g, ' ')}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex gap-3 flex-wrap">
          {['details', 'goal', 'risk'].map(step => (
            <button
              key={step}
              type="button"
              onClick={() => store.setStep(step as any)}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand transition-colors cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              Edit {step}
            </button>
          ))}
        </div>
      </Card>

      {/* Consent */}
      <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] text-brand focus:ring-brand"
            {...register('consent')}
          />
          <span className="text-sm text-ink-muted">{copy.consent}</span>
        </label>
        {errors.consent && <p role="alert" className="text-xs text-danger mt-2">{errors.consent.message}</p>}
      </div>
    </StepShell>
  )
}
