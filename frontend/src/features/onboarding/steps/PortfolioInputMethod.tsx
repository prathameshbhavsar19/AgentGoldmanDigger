import { useState } from 'react'
import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { uploadPortfolio } from '../../../lib/api'
import { UploadCloud, Edit2, Link2, Check } from 'lucide-react'
import { clsx } from 'clsx'

type Method = 'upload' | 'manual' | 'broker' | 'skip'

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

  return (
    <StepShell title="How would you like to add your portfolio?" onSubmit={handleSubmit} submitting={isPending}>
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
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
            onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setError('') } }}
          />
          <Button type="button" variant="secondary" size="md" onClick={() => fileRef.current?.click()}>
            {file ? file.name : 'Choose file…'}
          </Button>
          {file && <p className="text-xs text-success mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> {file.name} ready</p>}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
