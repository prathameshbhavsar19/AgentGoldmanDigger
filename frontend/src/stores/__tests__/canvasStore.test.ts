import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../canvasStore'

function getStore() { return useCanvasStore.getState() }
function dispatch(event: object) { getStore().handleEvent(event as any) }

beforeEach(() => { useCanvasStore.getState().reset() })

describe('canvasStore reducer', () => {
  it('analysis_started sets status to streaming', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    expect(getStore().status).toBe('streaming')
    expect(getStore().steps).toHaveLength(0)
  })

  it('activity_step_started adds a new active step', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'activity_step_started', stepId: 's1', phase: 'profile', label: 'Reading profile' })
    const steps = getStore().steps
    expect(steps).toHaveLength(1)
    expect(steps[0].stepId).toBe('s1')
    expect(steps[0].status).toBe('active')
    expect(steps[0].currentThought).toBe('')
  })

  it('activity_step_started moves previous active to pending', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'activity_step_started', stepId: 's1', phase: 'profile', label: 'Step 1' })
    dispatch({ event_type: 'activity_step_started', stepId: 's2', phase: 'goal', label: 'Step 2' })
    const steps = getStore().steps
    expect(steps[0].status).toBe('pending')
    expect(steps[1].status).toBe('active')
  })

  it('activity_thought_delta accumulates into currentThought', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'activity_step_started', stepId: 's1', phase: 'p', label: 'L' })
    dispatch({ event_type: 'activity_thought_delta', stepId: 's1', delta: 'Hello ' })
    dispatch({ event_type: 'activity_thought_delta', stepId: 's1', delta: 'world' })
    expect(getStore().steps[0].currentThought).toBe('Hello world')
  })

  it('activity_step_completed sets summary and status to completed', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'activity_step_started', stepId: 's1', phase: 'p', label: 'L' })
    dispatch({ event_type: 'activity_step_completed', stepId: 's1', summary: 'Done!' })
    const step = getStore().steps[0]
    expect(step.status).toBe('completed')
    expect(step.summary).toBe('Done!')
  })

  it('completed step remains visible (not removed)', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'activity_step_started', stepId: 's1', phase: 'p', label: 'L' })
    dispatch({ event_type: 'activity_step_completed', stepId: 's1', summary: 'Summary' })
    expect(getStore().steps).toHaveLength(1)
  })

  it('canvas_module_ready inserts module sorted by priority', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'canvas_module_ready', module: { type: 'risk_assessment', priority: 4, moduleId: 'm4', props: {} } })
    dispatch({ event_type: 'canvas_module_ready', module: { type: 'goal_summary',    priority: 1, moduleId: 'm1', props: {} } })
    const modules = getStore().modules
    expect(modules[0].priority).toBe(1)
    expect(modules[1].priority).toBe(4)
  })

  it('canvas_module_ready replaces existing module of same type', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'canvas_module_ready', module: { type: 'goal_summary', priority: 1, moduleId: 'm1', props: { name: 'A' } } })
    dispatch({ event_type: 'canvas_module_ready', module: { type: 'goal_summary', priority: 1, moduleId: 'm1', props: { name: 'B' } } })
    expect(getStore().modules).toHaveLength(1)
    expect((getStore().modules[0].props as any).name).toBe('B')
  })

  it('canvas_module_updating sets updating flag', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'canvas_module_ready', module: { type: 'goal_summary', priority: 1, moduleId: 'm1', props: {} } })
    dispatch({ event_type: 'canvas_module_updating', moduleId: 'm1' })
    expect(getStore().modules[0].updating).toBe(true)
  })

  it('analysis_completed sets status to ready', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'analysis_completed', jobId: 'j1' })
    expect(getStore().status).toBe('ready')
  })

  it('analysis_failed sets status to failed', () => {
    dispatch({ event_type: 'analysis_started', jobId: 'j1' })
    dispatch({ event_type: 'analysis_failed', message: 'Error occurred' })
    expect(getStore().status).toBe('failed')
  })

  it('selectOption toggles selected path', () => {
    getStore().selectOption('option-b')
    expect(getStore().selectedOption).toBe('option-b')
    getStore().selectOption(null)
    expect(getStore().selectedOption).toBeNull()
  })
})
