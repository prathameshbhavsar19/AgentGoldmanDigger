/**
 * Glossary — "Quick Words" slide: emoji + term + one-line plain meaning + tiny example.
 * v2: emoji/simple/example fields
 * v1: term/plain_definition/example fields (legacy)
 */
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

export interface GlossaryTerm {
  term: string
  // v2 visual
  emoji?: string
  simple?: string
  // v1 legacy
  plain_definition?: string
  example?: string
}

interface GlossaryProps {
  terms: GlossaryTerm[]
}

function TermCard({ term, index }: { term: GlossaryTerm; index: number }) {
  const definition = term.simple ?? term.plain_definition ?? ''
  const example = term.example

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.06 * index }}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        {term.emoji && <span className="text-2xl">{term.emoji}</span>}
        <p className="font-bold text-ink text-sm">{term.term}</p>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{definition}</p>
      {example && (
        <p className="text-[11px] text-ink-faint italic leading-relaxed border-l-2 border-[var(--border)] pl-2">
          {example}
        </p>
      )}
    </motion.div>
  )
}

export function Glossary({ terms }: GlossaryProps) {
  if (!terms?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-[#003366]/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-4 w-4 text-[#003366]" />
        </div>
        <h3 className="font-bold text-ink text-base">Quick Reference Glossary</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {terms.map((t, i) => (
          <TermCard key={t.term} term={t} index={i} />
        ))}
      </div>
    </motion.div>
  )
}

export default Glossary
