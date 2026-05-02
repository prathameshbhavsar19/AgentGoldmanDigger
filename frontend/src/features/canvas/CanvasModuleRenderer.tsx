import { motion } from 'framer-motion'
import type { CanvasModule } from '../../stores/canvasStore'
import { GoalSummaryCard } from './modules/GoalSummaryCard'
import { ReadinessCard } from './modules/ReadinessCard'
import { RiskAssessmentCard } from './modules/RiskAssessmentCard'
import { RiskDiagnosis } from './modules/RiskDiagnosis'
import { StrategyCardGrid } from './modules/StrategyCardGrid'
import { StrategyOptions } from './modules/StrategyOptions'
import { StrategyComparisonTable } from './modules/StrategyComparisonTable'
import { ImportantConsiderations } from './modules/ImportantConsiderations'
import { NextStepActions } from './modules/NextStepActions'
import { PortfolioSnapshotPanel } from './modules/PortfolioSnapshotPanel'
import { Glossary } from './modules/Glossary'

type RenderProps = { module: CanvasModule; onCompare?: () => void; onDownload?: () => void; onFollowUp?: () => void; allModules?: CanvasModule[] }

export function CanvasModuleRenderer({ module, onCompare, onDownload, onFollowUp, allModules }: RenderProps) {
  const p = module.props as any
  const updatingClass = module.updating ? 'opacity-50 pointer-events-none' : ''

  // Extract glossary terms from sibling modules so StrategyOptions can render tooltips
  const glossaryTerms = allModules?.find(m => m.type === 'glossary')?.props?.terms as any[] | undefined

  const content = (() => {
    switch (module.type) {
      case 'goal_summary':              return <GoalSummaryCard {...p} />
      case 'financial_readiness':       return <ReadinessCard {...p} />
      case 'risk_assessment':           return <RiskAssessmentCard {...p} />
      case 'risk_diagnosis':            return <RiskDiagnosis {...p} />
      case 'portfolio_snapshot':        return <PortfolioSnapshotPanel {...p} />
      // New demystified strategy options (from Node canvas LLM)
      case 'strategy_options':
        return p.options && p.options.some((o: any) => o.risk_tint || o.details_md_plain || o.allocation)
          ? <StrategyOptions {...p} glossaryTerms={glossaryTerms} />
          : <StrategyCardGrid {...p} />  // fallback for legacy mock format
      case 'strategy_comparison':       return <StrategyComparisonTable {...p} />
      case 'glossary':                  return <Glossary {...p} />
      case 'important_considerations':  return <ImportantConsiderations {...p} />
      case 'next_steps':
        return <NextStepActions {...p} onCompare={onCompare} onDownload={onDownload} onFollowUp={onFollowUp} />
      default: return null
    }
  })()

  if (!content) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative transition-opacity duration-200 ${updatingClass}`}
      data-module-type={module.type}
    >
      {module.updating && (
        <div className="absolute inset-0 rounded-lg shimmer z-10 pointer-events-none" />
      )}
      {content}
    </motion.div>
  )
}

export default CanvasModuleRenderer
