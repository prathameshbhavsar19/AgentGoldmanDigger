import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { Activity } from 'lucide-react'

interface RiskDiagnosisProps {
  diagnosis_plain: string
  key_concerns?: string[]
}

export function RiskDiagnosis({ diagnosis_plain, key_concerns }: RiskDiagnosisProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      data-testid="risk-diagnosis-module"
    >
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-ink">Portfolio Diagnosis</h3>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-line">{diagnosis_plain}</p>
        {key_concerns && key_concerns.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {key_concerns.map((concern, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[10px] text-ink-muted border border-[var(--border)]"
              >
                {concern}
              </span>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default RiskDiagnosis
