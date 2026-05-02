import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import Card from '../../../components/ui/Card'

export interface GlossaryTerm {
  term: string
  plain_definition: string
  example?: string
}

interface GlossaryProps {
  terms: GlossaryTerm[]
}

export function Glossary({ terms }: GlossaryProps) {
  if (!terms?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      data-testid="glossary-module"
    >
      <Card className="border border-[var(--border)] bg-[var(--bg-elev)]">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-ink">Quick Reference Glossary</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {terms.map((t, i) => (
            <motion.div
              key={t.term}
              id={`glossary-${t.term.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]"
            >
              <p className="text-xs font-semibold text-ink mb-1">{t.term}</p>
              <p className="text-xs text-ink-muted leading-relaxed">{t.plain_definition}</p>
              {t.example && (
                <p className="text-xs text-ink-faint mt-1 italic">e.g. {t.example}</p>
              )}
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

export default Glossary
