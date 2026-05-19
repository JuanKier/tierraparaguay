import { useEffect, useRef } from 'react'

const SSE_URL = (import.meta.env.VITE_API_URL || '') + '/api/events'

export function useSSE(event, callback) {
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    const es = new EventSource(SSE_URL)
    es.addEventListener(event, () => cb.current())
    es.onerror = () => es.close()
    return () => es.close()
  }, [event])
}
