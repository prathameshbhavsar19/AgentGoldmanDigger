import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { useCanvasStore } from '../../../stores/canvasStore'
import { Check } from 'lucide-react'

interface AllocationSlice { label: string; pct: number; color: string }
interface StrategyOption {
  id: string; title: string; summary: string; riskLevel: string; goalFit: string;
  allocation: AllocationSlice[]; pros: string[]; tradeoffs: string[]; nextAction: string;
}
interface StrategyCardGridProps { recommended: string; options: StrategyOption[] }

const RISK_BADGE: Record<string, 'success' | 'brand' | 'warn' | 'danger'> = {
  Low: 'success', Moderate: 'brand', 'Medium-High': 'warn', High: 'danger',
}

function StrategyCard({ option, recommended, selected, onSelect }: {
  option: StrategyOption; recommended: string; selected: boolean; onSelect: () => void
}) {
  const isRecommended = option.id === recommended
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`relative transition-all duration-200 cursor-pointer hover:shadow-panel ${
          selected ? 'ring-2 ring-brand shadow-panel' : ''
        } ${isRecommended ? 'border-accent/60' : ''}`}
        onClick={onSelect}
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSelect()}
      >
        {isRecommended && (
          <div className="absolute -top-2.5 left-4">
            <span className="text-xs bg-accent text-ink font-semibold px-2 py-0.5 rounded-full">Recommended</span>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Donut chart */}
          <div className="w-full md:w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={option.allocation} dataKey="pct" innerRadius={30} outerRadius={50} paddingAngle={2} startAngle={90} endAngle={-270}>
                  {option.allocation.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}%`, n as string]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-ink">{option.title}</h4>
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant={RISK_BADGE[option.riskLevel] ?? 'default'}>{option.riskLevel}</Badge>
                <Badge variant="accent">{option.goalFit}</Badge>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-3">{option.summary}</p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <p className="font-medium text-ink mb-1">Pros</p>
                <ul className="text-ink-muted space-y-0.5">
                  {option.pros.map(p => <li key={p} className="flex gap-1"><Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />{p}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Tradeoffs</p>
                <ul className="text-ink-muted space-y-0.5">
                  {option.tradeoffs.map(t => <li key={t}>• {t}</li>)}
                </ul>
              </div>
            </div>
            <p className="text-xs text-brand font-medium">{option.nextAction}</p>
          </div>
        </div>
        {selected && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
            <Check className="h-4 w-4 text-brand" />
            <span className="text-xs font-medium text-brand">Path selected</span>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export function StrategyCardGrid({ recommended, options }: StrategyCardGridProps) {
  const { selectedOption, selectOption } = useCanvasStore()
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-ink">Strategy Options</h3>
        <Badge variant="brand">{options.length} paths</Badge>
      </div>
      <div role="radiogroup" aria-label="Strategy options" className="flex flex-col gap-4">
        {options.map(o => (
          <StrategyCard
            key={o.id} option={o} recommended={recommended}
            selected={selectedOption === o.id}
            onSelect={() => selectOption(selectedOption === o.id ? null : o.id)}
          />
        ))}
      </div>
    </motion.div>
  )
}
export default StrategyCardGrid
