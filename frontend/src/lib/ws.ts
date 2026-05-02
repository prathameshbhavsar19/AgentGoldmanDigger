// Resilient WebSocket client with reconnect, heartbeat, and lastEventId tracking.
export type WsEventType =
  | 'analysis_started'
  | 'activity_step_started'
  | 'activity_thought_delta'
  | 'activity_step_completed'
  | 'canvas_module_ready'
  | 'canvas_module_updating'
  | 'canvas_generation_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'needs_user_input'

export interface WsEvent {
  event_type: WsEventType
  event_id?: string
  [key: string]: unknown
}

type EventHandler = (event: WsEvent) => void

export interface WsClientOptions {
  onEvent: EventHandler
  onOpen?: () => void
  onClose?: () => void
  onError?: (err: Event) => void
  heartbeatMs?: number
  heartbeatTimeoutMs?: number
  maxRetries?: number
  baseBackoffMs?: number
}

const DEFAULT_HEARTBEAT_MS = 25_000
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 35_000
const DEFAULT_BASE_BACKOFF_MS = 1_000
const DEFAULT_MAX_RETRIES = 10

export class WsClient {
  private url: string
  private opts: WsClientOptions
  private ws: WebSocket | null = null
  private retries = 0
  private closed = false
  private lastEventId: string | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null

  constructor(url: string, opts: WsClientOptions) {
    this.url = url
    this.opts = opts
    this.connect()
  }

  private connect() {
    if (this.closed) return
    const url = this.lastEventId
      ? `${this.url}?lastEventId=${encodeURIComponent(this.lastEventId)}`
      : this.url

    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      this.retries = 0
      this.opts.onOpen?.()
      this.startHeartbeat()
    }

    ws.onmessage = (msg) => {
      if (msg.data === 'pong') {
        this.resetHeartbeatTimeout()
        return
      }
      try {
        const event: WsEvent = JSON.parse(msg.data)
        if (event.event_id) this.lastEventId = event.event_id
        this.opts.onEvent(event)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      this.stopHeartbeat()
      this.opts.onClose?.()
      if (!this.closed) this.scheduleReconnect()
    }

    ws.onerror = (err) => {
      this.opts.onError?.(err)
    }
  }

  private scheduleReconnect() {
    const maxRetries = this.opts.maxRetries ?? DEFAULT_MAX_RETRIES
    if (this.retries >= maxRetries) return
    const delay =
      (this.opts.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS) *
      Math.pow(2, this.retries) *
      (0.8 + Math.random() * 0.4) // ±20% jitter
    this.retries++
    setTimeout(() => this.connect(), delay)
  }

  private startHeartbeat() {
    const interval = this.opts.heartbeatMs ?? DEFAULT_HEARTBEAT_MS
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
        this.startHeartbeatTimeout()
      }
    }, interval)
  }

  private startHeartbeatTimeout() {
    this.clearHeartbeatTimeout()
    this.heartbeatTimeoutTimer = setTimeout(() => {
      this.ws?.close(4000, 'heartbeat timeout')
    }, this.opts.heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS)
  }

  private resetHeartbeatTimeout() {
    this.clearHeartbeatTimeout()
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutTimer !== null) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.clearHeartbeatTimeout()
  }

  send(data: string) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data)
  }

  destroy() {
    this.closed = true
    this.stopHeartbeat()
    this.ws?.close(1000, 'destroyed')
    this.ws = null
  }

  getLastEventId(): string | null {
    return this.lastEventId
  }
}
