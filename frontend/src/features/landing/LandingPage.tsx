import { useNavigate } from 'react-router-dom'
import { ArrowRight, TrendingUp, Target, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { copy } from '../../lib/copy'
import { CompassIcon, ShieldIcon, GoalFlagIcon } from '../../components/icons'

const trustItems = [
  { icon: GoalFlagIcon, label: copy.trustSignals[0] },
  { icon: ShieldIcon,   label: copy.trustSignals[1] },
  { icon: CompassIcon,  label: copy.trustSignals[2] },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand/5 translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <motion.div
              custom={0} variants={fadeUp} initial="hidden" animate="show"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-[var(--accent-soft)] text-[var(--accent-strong)] text-xs font-medium mb-6"
            >
              <Cpu className="h-3.5 w-3.5" />
              AI-Powered Portfolio Intelligence
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight tracking-tight mb-6"
            >
              Navigate your{' '}
              <span className="text-brand">investments</span>
              {' '}with intelligence.
            </motion.h1>

            {/* Sub */}
            <motion.p
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="text-lg text-ink-muted leading-relaxed mb-10 max-w-lg"
            >
              {copy.subTagline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="flex flex-wrap gap-3"
            >
              <Button
                size="lg"
                onClick={() => navigate('/onboarding')}
                className="gap-2"
                data-testid="cta-start"
              >
                {copy.ctaStart}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  localStorage.setItem('pgps-demo-persona', 'newInvestor')
                  navigate('/onboarding?demo=1')
                }}
                data-testid="cta-demo"
              >
                {copy.ctaDemo}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[var(--border)] bg-bg-elev/60" aria-label="Key features">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustItems.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                custom={i} variants={fadeUp} initial="hidden" animate="show"
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[var(--accent-strong)]" />
                </div>
                <span className="text-sm font-medium text-ink">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-ink mb-4">Built for the modern investor</h2>
          <p className="text-ink-muted max-w-xl mx-auto">Whether you are starting from zero or refining an existing portfolio, Portfolio GPS adapts to you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Target,
              title: 'Goal-based analysis',
              desc: 'Tell us your financial goal and timeline. We tailor every recommendation to your specific situation.',
            },
            {
              icon: TrendingUp,
              title: 'Live AI strategy canvas',
              desc: 'Watch the AI analyst work in real time. See strategy options appear on a live canvas as the analysis progresses.',
            },
            {
              icon: ShieldIcon,
              title: 'Risk-aware guidance',
              desc: 'Your risk comfort drives every suggestion. We never push strategies that do not match your investment personality.',
            },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="bg-bg-elev rounded-xl border border-[var(--border)] p-6 shadow-card"
            >
              <div className="h-12 w-12 rounded-xl bg-brand/8 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-brand" />
              </div>
              <h3 className="font-semibold text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-ink text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/80 mb-4">
            Goldman Sachs Hackathon 2026
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">Take the free portfolio check. It takes about 3 minutes.</p>
          <Button
            size="lg"
            onClick={() => navigate('/onboarding')}
            className="bg-accent hover:bg-[var(--accent-strong)] text-ink border-0 gap-2"
          >
            {copy.ctaStart}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-6 text-xs text-white/50">{copy.disclaimer}</p>
        </div>
      </section>
    </div>
  )
}
