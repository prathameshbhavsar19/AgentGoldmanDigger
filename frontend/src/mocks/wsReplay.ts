// WS timeline replay engine — used by mock dev server and unit tests
import type { WsEvent } from '../lib/ws'

export interface TimelineEntry {
  delayMs: number
  event: WsEvent
}

export function replayTimeline(
  timeline: TimelineEntry[],
  onEvent: (event: WsEvent) => void,
  opts: { speedMultiplier?: number } = {}
): { cancel: () => void } {
  const m = opts.speedMultiplier ?? 1
  const timers: ReturnType<typeof setTimeout>[] = []
  let cancelled = false

  for (const entry of timeline) {
    const t = setTimeout(() => {
      if (!cancelled) onEvent(entry.event)
    }, entry.delayMs / m)
    timers.push(t)
  }

  return {
    cancel: () => {
      cancelled = true
      timers.forEach(clearTimeout)
    },
  }
}
