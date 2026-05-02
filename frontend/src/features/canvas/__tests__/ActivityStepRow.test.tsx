import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityStepRow } from '../ActivityStepRow'
import type { ActivityStep } from '../../../stores/canvasStore'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = () => {}
})

function makeStep(overrides: Partial<ActivityStep> = {}): ActivityStep {
  return {
    stepId: 's1', phase: 'profile', label: 'Reading your profile',
    status: 'pending', currentThought: '', summary: '',
    ...overrides,
  }
}

describe('ActivityStepRow', () => {
  it('renders the step label', () => {
    render(<ActivityStepRow step={makeStep()} />)
    expect(screen.getByText('Reading your profile')).toBeInTheDocument()
  })

  it('shows current thought when active', () => {
    render(<ActivityStepRow step={makeStep({ status: 'active', currentThought: 'Thinking about you...' })} />)
    expect(screen.getByText(/Thinking about you/)).toBeInTheDocument()
  })

  it('shows summary when completed', () => {
    render(<ActivityStepRow step={makeStep({ status: 'completed', summary: 'Done nicely.' })} />)
    expect(screen.getByText('Done nicely.')).toBeInTheDocument()
  })

  it('does not show thought when pending', () => {
    render(<ActivityStepRow step={makeStep({ status: 'pending', currentThought: 'hidden' })} />)
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })

  it('shows error summary when status is error', () => {
    render(<ActivityStepRow step={makeStep({ status: 'error', summary: 'Something went wrong' })} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
