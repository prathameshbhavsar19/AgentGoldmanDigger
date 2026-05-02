import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { ShieldIcon } from '../../../components/icons'
import { AlertTriangle } from 'lucide-react'

interface DrawdownScenario { label: string; impact: string; advice: string }
interface RiskAssessmentProps {
  portfolioRisk: string; behaviouralRisk: string;
  mismatch: boolean; mismatchNote?: string | null;
  drawdownScenario: DrawdownScenario
}

export function RiskAssessmentCard({ portfolioRisk, behaviouralRisk, mismatch, mismatchNote, drawdownScenario }: RiskAssessmentProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
            <ShieldIcon className="h-5 w-5 text-[var(--accent-strong)]" />
          </div>
          <h3 className="font-semibold text-ink">Risk Assessment</h3>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">Portfolio risk</span>
            <Badge variant="warn">{portfolioRisk}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">Behavioural risk</span>
            <Badge variant="default">{behaviouralRisk}</Badge>
          </div>
        </div>
        {mismatch && mismatchNote && (
          <div className="flex gap-2 p-3 rounded-lg bg-[var(--warn-soft)] border border-[var(--warn)]/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-warn flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-muted">{mismatchNote}</p>
          </div>
        )}
        <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
          <p className="text-xs font-medium text-ink mb-1">{drawdownScenario.label}</p>
          <p className="text-xs text-ink-muted mb-1">{drawdownScenario.impact}</p>
          <p className="text-xs text-ink-faint">{drawdownScenario.advice}</p>
        </div>
      </Card>
    </motion.div>
  )
}
export default RiskAssessmentCard
