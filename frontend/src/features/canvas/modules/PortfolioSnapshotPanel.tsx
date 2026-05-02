import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Holding { name: string; pct: number; type: string }
interface PortfolioSnapshotProps {
  totalValue?: string; holdingCount?: number; largestHolding?: string;
  sectorExposure?: Record<string, number>; allocationData?: Holding[]
}

const CHART_COLORS = ['#1F3A8A', '#B89D5E', '#64748B', '#1F6F4A', '#9B2C2C']

export function PortfolioSnapshotPanel({ totalValue, holdingCount, largestHolding, sectorExposure, allocationData }: PortfolioSnapshotProps) {
  const chartData = allocationData ?? Object.entries(sectorExposure ?? {}).map(([name, pct]) => ({ name, pct }))
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Portfolio Snapshot</h3>
          {totalValue && <Badge variant="brand">{totalValue} total</Badge>}
        </div>
        {holdingCount && <p className="text-xs text-ink-muted mb-3">{holdingCount} holdings detected {largestHolding && `· Largest: ${largestHolding}`}</p>}
        {chartData.length > 0 && (
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Bar dataKey="pct" radius={[3,3,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
export default PortfolioSnapshotPanel
