import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanvasModuleRenderer } from '../CanvasModuleRenderer'
import type { CanvasModule } from '../../../stores/canvasStore'

function makeModule(overrides: Partial<CanvasModule>): CanvasModule {
  return {
    moduleId: 'm1', type: 'goal_summary', priority: 1,
    props: {}, updating: false, ...overrides,
  }
}

describe('CanvasModuleRenderer', () => {
  it('renders GoalSummaryCard for goal_summary type', () => {
    const props = { name: 'Priya', goal: 'Wealth creation', timeHorizon: '10+ years', monthlyAmount: '$150', emergencySavings: '1–3 months', riskTone: 'Balanced', tone: 'encouraging' }
    render(<CanvasModuleRenderer module={makeModule({ type: 'goal_summary', props })} />)
    expect(screen.getByText(/Priya/)).toBeInTheDocument()
  })

  it('renders nothing for unknown type', () => {
    const { container } = render(<CanvasModuleRenderer module={makeModule({ type: 'unknown_type', props: {} })} />)
    expect(container.firstChild).toBeNull()
  })

  it('applies module type as data attribute', () => {
    const props = { name: 'T', goal: 'G', timeHorizon: 'T', monthlyAmount: '$0', emergencySavings: 'none', riskTone: 'Low', tone: 'encouraging' }
    const { container } = render(<CanvasModuleRenderer module={makeModule({ type: 'goal_summary', props })} />)
    expect(container.querySelector('[data-module-type="goal_summary"]')).toBeTruthy()
  })
})
