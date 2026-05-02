import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { GoalFlagIcon } from '../../../components/icons'

interface GoalSummaryProps {
  name: string
  goal: string
  timeHorizon: string
  monthlyAmount: string
  emergencySavings: string
  riskTone: string
  tone: string
}

export function GoalSummaryCard({ name, goal, timeHorizon, monthlyAmount, emergencySavings, riskTone }: GoalSummaryProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-l-4 border-l-brand">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
            <GoalFlagIcon className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-1">Your Profile</p>
            <h3 className="text-xl font-bold text-ink mb-2">{name}, here is your strategic snapshot.</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand">Goal: {goal}</Badge>
              <Badge variant="accent">Horizon: {timeHorizon}</Badge>
              <Badge>{monthlyAmount}/mo</Badge>
              <Badge>Savings: {emergencySavings}</Badge>
              <Badge variant="default">Risk: {riskTone}</Badge>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
export default GoalSummaryCard
