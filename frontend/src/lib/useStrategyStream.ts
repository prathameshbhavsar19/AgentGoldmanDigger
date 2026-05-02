import { useEffect, useRef } from 'react'
import { WsClient } from './ws'
import { useCanvasStore } from '../stores/canvasStore'

export function useStrategyStream(jobId: string | undefined) {
  const clientRef = useRef<WsClient | null>(null)
  const handleEvent = useCanvasStore(s => s.handleEvent)

  useEffect(() => {
    if (!jobId) return

    const client = new WsClient(`/ws/strategy/${jobId}`, {
      onEvent: handleEvent,
      heartbeatMs: 25_000,
      heartbeatTimeoutMs: 35_000,
      maxRetries: 10,
    })
    clientRef.current = client
    return () => {
      client.destroy()
      clientRef.current = null
    }
  }, [jobId, handleEvent])

  return clientRef
}
