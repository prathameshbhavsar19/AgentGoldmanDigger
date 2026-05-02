import { useState, useRef } from 'react'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { uploadPortfolio, submitManualPortfolio, type ManualHolding } from '../../../lib/api'
import { UploadCloud, Edit2, Link2, Check, Plus, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

type Method = 'upload' | 'manual' | 'broker' | 'skip'

// ── Manual entry schema ────────────────────────────────────
const holdingSchema = z.object({
  assetName:   z.string().min(1, 'Name required'),
  assetSymbol: z.string().optional(),
  assetType:   z.string().min(1, 'Type required'),
  quantity:    z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().positive().optional()),
  marketValue: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().positive().optional()),
  currency:    z.string().min(1, 'Currency required'),
})

const manualSchema = z.object({
  holdings: z.array(holdingSchema).min(1, 'Add at least one holding'),
})

type ManualFormValues = z.infer<typeof manualSchema>

const EMPTY_HOLDING: ManualFormValues['holdings'][number] = {
  assetName: '', assetSymbol: '', assetType: 'stock', quantity: undefined, marketValue: undefined, currency: 'USD',
}

const ASSET_TYPES = ['stock', 'etf', 'mutual_fund', 'bond', 'crypto', 'cash', 'other']
const CURRENCIES  = ['USD', 'GBP', 'EUR', 'INR', 'AED', 'SGD', 'CAD', 'AUD']

function ManualEntryTable({
  sessionId,
  onDone,
}: {
  sessionId: string
  onDone: () => void
}) {
  const { control, register, handleSubmit, formState: { errors } } = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: { holdings: [{ ...EMPTY_HOLDING }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'holdings' })

  const { mutate, isPending, error: submitError } = useMutation({
    mutationFn: (data: ManualFormValues) =>
      submitManualPortfolio(sessionId, data.holdings as ManualHolding[]),
    onSuccess: onDone,
  })

  const colHeader = (label: string, required?: boolean) => (
    <th scope="col" className="px-2 py-2 text-xs font-medium text-ink-muted text-left whitespace-nowrap">
      {label}{required && <span className="text-danger ml-0.5">*</span>}
    </th>
  )

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded border border-[var(--border)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
            <tr>
              {colHeader('Asset name', true)}
              {colHeader('Symbol')}
              {colHeader('Type', true)}
              {colHeader('Qty')}
              {colHeader('Market value')}
              {colHeader('Currency', true)}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {fields.map((field, idx) => {
              const rowErr = errors.holdings?.[idx]
              return (
                <tr key={field.id} className="bg-bg-elev">
                  <td className="px-2 py-1.5">
                    <input
                      {...register(`holdings.${idx}.assetName`)}
                      placeholder="Apple Inc."
                      className={clsx(inputCls, rowErr?.assetName && 'border-danger')}
                    />
                    {rowErr?.assetName && <p className="text-xs text-danger mt-0.5">{rowErr.assetName.message}</p>}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      {...register(`holdings.${idx}.assetSymbol`)}
                      placeholder="AAPL"
                      className={inputCls}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      {...register(`holdings.${idx}.assetType`)}
                      className={clsx(inputCls, rowErr?.assetType && 'border-danger')}
                    >
                      {ASSET_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      {...register(`holdings.${idx}.quantity`)}
                      placeholder="10"
                      className={clsx(inputCls, 'w-20')}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      {...register(`holdings.${idx}.marketValue`)}
                      placeholder="1500"
                      className={clsx(inputCls, 'w-24')}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Controller
                      control={control}
                      name={`holdings.${idx}.currency`}
                      render={({ field: f }) => (
                        <select {...f} className={clsx(inputCls, rowErr?.currency && 'border-danger')}>
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                      className="p-1.5 rounded text-ink-muted hover:text-danger hover:bg-danger/10 disabled:opacity-30 transition-colors"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {errors.holdings?.root && (
        <p role="alert" className="text-sm text-danger">{errors.holdings.root.message}</p>
      )}
      {submitError && (
        <p role="alert" className="text-sm text-danger">
          Failed to save holdings — please try again.
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ ...EMPTY_HOLDING })}
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </Button>

        <Button type="submit" size="md" loading={isPending}>
          Save &amp; continue
        </Button>
      </div>
    </form>
  )
}

const inputCls =
  'w-full rounded border border-[var(--border)] bg-bg-elev px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors'

// ── Main step component ────────────────────────────────────
export default function PortfolioInputMethodStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [method, setMethod] = useState<Method | ''>(store.portfolioMethod as Method || '')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { mutate: doUpload, isPending } = useMutation({
    mutationFn: (f: File) => uploadPortfolio(store.sessionId!, f),
    onSuccess: (data) => {
      store.setPortfolioFile(data.fileId, data.fileName)
      store.patch({ portfolioMethod: 'upload' })
      store.nextStep()
    },
    onError: () => setError('Upload failed. Please try again or use manual entry.'),
  })

  const handleSubmit = async () => {
    if (!method) { setError('Please select how you want to add your portfolio.'); return }
    if (method === 'upload') {
      if (!file) { setError('Please select a file to upload.'); return }
      doUpload(file)
      return
    }
    if (method === 'manual') {
      // Manual submission is handled by ManualEntryTable; we don't advance here
      return
    }
    store.patch({ portfolioMethod: method })
    await save({ portfolioMethod: method })
    store.nextStep()
  }

  const options: Array<{ id: Method; icon: typeof UploadCloud; label: string; desc: string; disabled?: boolean }> = [
    { id: 'upload', icon: UploadCloud, label: 'Upload portfolio statement', desc: 'CSV, Excel, or PDF' },
    { id: 'manual', icon: Edit2,       label: 'Enter holdings manually',   desc: 'Type your stocks, funds, and values' },
    { id: 'broker', icon: Link2,       label: 'Connect broker / platform', desc: 'Coming soon', disabled: true },
    { id: 'skip',   icon: Check,       label: 'Skip — use estimates',      desc: 'We will estimate based on your profile' },
  ]

  // When manual is selected and the table has saved successfully, advance the wizard
  const handleManualDone = async () => {
    store.patch({ portfolioMethod: 'manual' })
    await save({ portfolioMethod: 'manual' })
    store.nextStep()
  }

  return (
    <StepShell
      title="How would you like to add your portfolio?"
      onSubmit={method === 'manual' ? undefined : handleSubmit}
      submitting={isPending}
      hideSubmit={method === 'manual'}
    >
      <div className="flex flex-col gap-3">
        {options.map(o => (
          <Card
            key={o.id}
            role="radio"
            aria-checked={method === o.id}
            aria-disabled={o.disabled}
            tabIndex={o.disabled ? -1 : 0}
            onKeyDown={(e: React.KeyboardEvent) => !o.disabled && e.key === 'Enter' && setMethod(o.id)}
            onClick={() => !o.disabled && setMethod(o.id)}
            padding="sm"
            className={clsx(
              'cursor-pointer transition-all duration-150',
              method === o.id ? 'ring-2 ring-brand border-brand' : 'hover:border-brand/40',
              o.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <o.icon className="h-5 w-5 text-ink-muted flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{o.label}</p>
                <p className="text-xs text-ink-muted">{o.desc}</p>
              </div>
              {o.disabled && <span className="text-xs bg-[var(--bg-subtle)] text-ink-faint px-2 py-0.5 rounded-full border">Soon</span>}
            </div>
          </Card>
        ))}
      </div>

      {method === 'upload' && (
        <div className="mt-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setError('') } }}
          />
          <Button type="button" variant="secondary" size="md" onClick={() => fileRef.current?.click()}>
            {file ? file.name : 'Choose file…'}
          </Button>
          {file && <p className="text-xs text-success mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> {file.name} ready</p>}
        </div>
      )}

      {method === 'manual' && store.sessionId && (
        <div className="mt-4">
          <ManualEntryTable sessionId={store.sessionId} onDone={handleManualDone} />
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
