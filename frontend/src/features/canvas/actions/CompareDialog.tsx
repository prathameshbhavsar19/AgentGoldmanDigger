import Dialog from '../../../components/ui/Dialog'
import { StrategyComparisonTable } from '../modules/StrategyComparisonTable'
import { useCanvasStore } from '../../../stores/canvasStore'

interface CompareDialogProps { open: boolean; onClose: () => void }

export function CompareDialog({ open, onClose }: CompareDialogProps) {
  const modules = useCanvasStore(s => s.modules)
  const strategyMod = modules.find(m => m.type === 'strategy_options')
  const options = (strategyMod?.props as any)?.options ?? []
  return (
    <Dialog open={open} onOpenChange={onClose} title="Compare All Strategy Options" size="xl">
      <StrategyComparisonTable options={options} />
    </Dialog>
  )
}
export default CompareDialog
