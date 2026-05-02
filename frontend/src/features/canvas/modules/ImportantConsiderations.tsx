import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { AlertTriangle } from 'lucide-react'

export interface ConsiderationItem {
  verbatim: string
  plain_meaning?: string
}

// Supports both new { verbatim, plain_meaning } format and legacy string[]
type ConsiderationInput = string | ConsiderationItem

interface ImportantConsiderationsProps {
  items: ConsiderationInput[]
}

function normalize(item: ConsiderationInput): ConsiderationItem {
  if (typeof item === 'string') return { verbatim: item }
  return item
}

export function ImportantConsiderations({ items }: ImportantConsiderationsProps) {
  if (!items?.length) return null
  const normalized = items.map(normalize)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      data-testid="important-considerations-module"
    >
      <Card className="border border-amber-200/70 bg-amber-50/30">
        {/* Info-amber accent bar */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 w-1 self-stretch rounded-full bg-amber-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-ink">Important Considerations</h3>
            </div>
            <ul className="space-y-3">
              {normalized.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="space-y-1"
                >
                  {/* Verbatim — preserved exactly */}
                  <p className="text-xs font-medium text-ink leading-relaxed">{item.verbatim}</p>
                  {/* Plain meaning — human-friendly explanation */}
                  {item.plain_meaning && (
                    <p className="text-xs text-ink-muted leading-relaxed pl-2 border-l-2 border-amber-300/60">
                      {item.plain_meaning}
                    </p>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default ImportantConsiderations
