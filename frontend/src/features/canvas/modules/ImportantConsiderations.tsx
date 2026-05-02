import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { Info } from 'lucide-react'

interface ImportantConsiderationsProps { items: string[] }

export function ImportantConsiderations({ items }: ImportantConsiderationsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
      <Card className="bg-[var(--bg-subtle)]">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-ink-muted" />
          <h3 className="text-sm font-semibold text-ink">Important Considerations</h3>
        </div>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-ink-muted">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-ink-faint flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  )
}
export default ImportantConsiderations
