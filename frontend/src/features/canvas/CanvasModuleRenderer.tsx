import type { CanvasModule } from '../../stores/canvasStore'
import { GoalSummaryCard } from './modules/GoalSummaryCard'
import { ReadinessCard } from './modules/ReadinessCard'
import { RiskAssessmentCard } from './modules/RiskAssessmentCard'
import { StrategyCardGrid } from './modules/StrategyCardGrid'
import { StrategyComparisonTable } from './modules/StrategyComparisonTable'
import { ImportantConsiderations } from './modules/ImportantConsiderations'
import { NextStepActions } from './modules/NextStepActions'
import { PortfolioSnapshotPanel } from './modules/PortfolioSnapshotPanel'

type RenderProps = { module: CanvasModule; onCompare?: () => void; onDownload?: () => void; onFollowUp?: () => void }

export function CanvasModuleRenderer({ module, onCompare, onDownload, onFollowUp }: RenderProps) {
  const p = module.props as any
  const updatingClass = module.updating ? 'opacity-50 pointer-events-none' : ''

  const content = (() => {
    switch (module.type) {
      case 'goal_summary':           return <GoalSummaryCard {...p} />
      case 'financial_readiness':    return <ReadinessCard {...p} />
      case 'risk_assessment':        return <RiskAssessmentCard {...p} />
      case 'strategy_options':       return <StrategyCardGrid {...p} />
      case 'strategy_comparison':    return <StrategyComparisonTable {...p} />
      case 'important_considerations': return <ImportantConsiderations {...p} />
      case 'next_steps':             return <NextStepActions {...p} onCompare={onCompare} onDownload={onDownload} onFollowUp={onFollowUp} />
      case 'portfolio_snapshot':     return <PortfolioSnapshotPanel {...p} />
      default: return null
    }
  })()

  if (!content) return null
  return (
    <div className={`relative transition-opacity duration-200 ${updatingClass}`} data-module-type={module.type}>
      {module.updating && (
        <div className="absolute inset-0 rounded-lg shimmer z-10 pointer-events-none" />
      )}
      {content}
    </div>
  )
}
export default CanvasModuleRenderer
