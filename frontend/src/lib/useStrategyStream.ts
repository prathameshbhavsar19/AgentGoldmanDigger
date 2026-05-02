import { useEffect, useRef } from 'react'
import { WsClient } from './ws'
import { useCanvasStore } from '../stores/canvasStore'

export function useStrategyStream(jobId: string | undefined) {
  const clientRef = useRef<WsClient | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const handleEvent = useCanvasStore(s => s.handleEvent)

  useEffect(() => {
    if (!jobId) return

    if (import.meta.env.VITE_USE_MOCKS === '1') {
      // Use in-process mock replay — no real WS connection needed
      import('../mocks/mockWsServer').then(({ mockWsConnect }) => {
        const cleanup = mockWsConnect(jobId, handleEvent)
        cleanupRef.current = cleanup
      })
      return () => {
        cleanupRef.current?.()
        cleanupRef.current = null
      }
    }

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
