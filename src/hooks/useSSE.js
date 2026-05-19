import { useEffect, useRef } from 'react'

export function useSSE(event, callback) {
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    const es = new EventSource('/api/events')
    es.addEventListener(event, () => cb.current())
    es.onerror = () => es.close()
    return () => es.close()
  }, [event])
}
