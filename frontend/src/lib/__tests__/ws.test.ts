import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WsClient } from '../ws'

// Mock WebSocket
class MockWebSocket extends EventTarget {
  static OPEN = 1
  static CLOSED = 3
  readyState = MockWebSocket.OPEN
  url: string
  sentMessages: string[] = []
  onopen: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  constructor(url: string) { super(); this.url = url; allSockets.push(this) }
  send(data: string) { this.sentMessages.push(data) }
  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ code: code ?? 1000, reason: reason ?? '' } as CloseEvent)
  }
  simulateOpen() { this.onopen?.(new Event('open')) }
  simulateMessage(data: string) { this.onmessage?.({ data } as MessageEvent) }
  simulateClose() { this.close(1006, 'simulated close') }
}

let allSockets: MockWebSocket[] = []

beforeEach(() => {
  allSockets = []
  vi.stubGlobal('WebSocket', MockWebSocket)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('WsClient', () => {
  it('opens connection and calls onOpen', () => {
    const onOpen = vi.fn()
    new WsClient('ws://test/path', { onEvent: vi.fn(), onOpen })
    allSockets[0].simulateOpen()
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('calls onEvent with parsed JSON', () => {
    const onEvent = vi.fn()
    new WsClient('ws://test', { onEvent })
    allSockets[0].simulateOpen()
    allSockets[0].simulateMessage(JSON.stringify({ event_type: 'analysis_started', event_id: 'e1', jobId: 'j1' }))
    expect(onEvent).toHaveBeenCalledWith({ event_type: 'analysis_started', event_id: 'e1', jobId: 'j1' })
  })

  it('tracks lastEventId from events', () => {
    const onEvent = vi.fn()
    const client = new WsClient('ws://test', { onEvent })
    allSockets[0].simulateOpen()
    allSockets[0].simulateMessage(JSON.stringify({ event_type: 'analysis_started', event_id: 'e42' }))
    expect(client.getLastEventId()).toBe('e42')
  })

  it('reconnects after close with backoff', () => {
    new WsClient('ws://test', { onEvent: vi.fn(), baseBackoffMs: 100, maxRetries: 3 })
    const first = allSockets[0]
    first.simulateOpen()
    first.simulateClose()
    expect(allSockets.length).toBe(1) // second not opened yet
    vi.advanceTimersByTime(200)
    expect(allSockets.length).toBe(2) // reconnected
  })

  it('stops reconnecting after maxRetries', () => {
    new WsClient('ws://test', { onEvent: vi.fn(), baseBackoffMs: 10, maxRetries: 2 })
    // Do NOT simulateOpen — opening resets retries to 0. Close immediately so retries accumulate.
    allSockets[0].simulateClose()   // retries: 0→1, schedules reconnect
    vi.advanceTimersByTime(1000)    // socket[1] created
    allSockets[1].simulateClose()   // retries: 1→2, schedules reconnect
    vi.advanceTimersByTime(1000)    // socket[2] created
    allSockets[2].simulateClose()   // retries: 2 >= maxRetries: 2, no more reconnects
    vi.advanceTimersByTime(1000)
    expect(allSockets.length).toBe(3) // initial + 2 retries, no further
  })

  it('sends ping heartbeat after interval', () => {
    new WsClient('ws://test', { onEvent: vi.fn(), heartbeatMs: 25000 })
    allSockets[0].simulateOpen()
    vi.advanceTimersByTime(25001)
    expect(allSockets[0].sentMessages).toContain('ping')
  })

  it('closes on heartbeat timeout when no pong', () => {
    // heartbeatMs (500) > heartbeatTimeoutMs (200) so the interval cannot fire a second
    // time and reset the pending timeout before it triggers the close.
    new WsClient('ws://test', { onEvent: vi.fn(), heartbeatMs: 500, heartbeatTimeoutMs: 200 })
    allSockets[0].simulateOpen()
    vi.advanceTimersByTime(501)  // interval fires at 500ms → sends ping, starts 200ms timeout
    vi.advanceTimersByTime(201)  // timeout fires at 701ms → closes socket
    expect(allSockets[0].readyState).toBe(MockWebSocket.CLOSED)
  })

  it('resets heartbeat timeout when pong received', () => {
    new WsClient('ws://test', { onEvent: vi.fn(), heartbeatMs: 100, heartbeatTimeoutMs: 300 })
    allSockets[0].simulateOpen()
    vi.advanceTimersByTime(101) // ping sent
    allSockets[0].simulateMessage('pong')
    vi.advanceTimersByTime(299) // just under timeout
    expect(allSockets[0].readyState).toBe(MockWebSocket.OPEN)
  })

  it('does not reconnect after destroy()', () => {
    const client = new WsClient('ws://test', { onEvent: vi.fn(), baseBackoffMs: 10 })
    allSockets[0].simulateOpen()
    client.destroy()
    vi.advanceTimersByTime(100)
    expect(allSockets.length).toBe(1) // no reconnect
  })

  it('includes lastEventId in reconnect URL', () => {
    new WsClient('ws://test', { onEvent: vi.fn(), baseBackoffMs: 10, maxRetries: 3 })
    allSockets[0].simulateOpen()
    allSockets[0].simulateMessage(JSON.stringify({ event_type: 'activity_step_started', event_id: 'e99', stepId: 's1', phase: 'p', label: 'L' }))
    allSockets[0].simulateClose()
    vi.advanceTimersByTime(100)
    expect(allSockets[1]?.url).toContain('lastEventId=e99')
  })
})
