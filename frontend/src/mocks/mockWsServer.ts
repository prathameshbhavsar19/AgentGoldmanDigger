// In-process mock WebSocket server for development (VITE_USE_MOCKS=1)
// Overrides lib/ws.ts WsClient so the canvas demo works without Node/Python.
import type { WsEvent } from '../lib/ws'
import { replayTimeline } from './wsReplay'
import newInvestorTimeline from '../__fixtures__/wsTimeline/newInvestor.json'

type TimelineEntry = { delayMs: number; event: WsEvent }

const TIMELINES: Record<string, TimelineEntry[]> = {
  'job-mock-001': newInvestorTimeline as TimelineEntry[],
}

const listeners: Map<string, Set<(event: WsEvent) => void>> = new Map()
const replays: Map<string, ReturnType<typeof replayTimeline>> = new Map()

/** Call this when a canvas page connects to /ws/strategy/:jobId */
export function mockWsConnect(jobId: string, onEvent: (event: WsEvent) => void): () => void {
  if (!listeners.has(jobId)) listeners.set(jobId, new Set())
  listeners.get(jobId)!.add(onEvent)

  const timeline = TIMELINES[jobId] ?? TIMELINES['job-mock-001']
  if (!replays.has(jobId)) {
    const replay = replayTimeline(timeline, (ev) => {
      listeners.get(jobId)?.forEach(cb => cb(ev))
    }, { speedMultiplier: 1 })
    replays.set(jobId, replay)
  }

  return () => {
    listeners.get(jobId)?.delete(onEvent)
    if (listeners.get(jobId)?.size === 0) {
      replays.get(jobId)?.cancel()
      replays.delete(jobId)
      listeners.delete(jobId)
    }
  }
}
