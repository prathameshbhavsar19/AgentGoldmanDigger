import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { replayTimeline } from '../wsReplay'
import type { WsEvent } from '../../lib/ws'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('replayTimeline', () => {
  it('fires events at the correct delays', () => {
    const onEvent = vi.fn()
    const timeline = [
      { delayMs: 100, event: { event_type: 'analysis_started' as const, jobId: 'j1' } },
      { delayMs: 500, event: { event_type: 'analysis_completed' as const, jobId: 'j1' } },
    ]
    replayTimeline(timeline, onEvent)
    expect(onEvent).not.toHaveBeenCalled()
    vi.advanceTimersByTime(101)
    expect(onEvent).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(400)
    expect(onEvent).toHaveBeenCalledTimes(2)
  })

  it('respects speedMultiplier', () => {
    const onEvent = vi.fn()
    const timeline = [{ delayMs: 1000, event: { event_type: 'analysis_started' as const } as WsEvent }]
    replayTimeline(timeline, onEvent, { speedMultiplier: 10 })
    vi.advanceTimersByTime(101)
    expect(onEvent).toHaveBeenCalledOnce()
  })

  it('cancel stops all pending events', () => {
    const onEvent = vi.fn()
    const timeline = [{ delayMs: 200, event: { event_type: 'analysis_started' as const } as WsEvent }]
    const { cancel } = replayTimeline(timeline, onEvent)
    cancel()
    vi.advanceTimersByTime(1000)
    expect(onEvent).not.toHaveBeenCalled()
  })
})
