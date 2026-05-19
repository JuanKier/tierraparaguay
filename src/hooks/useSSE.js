import { useEffect, useRef } from 'react'

export function useSSE(event, callback) {
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    if (window.Capacitor?.isNativePlatform?.()) return

    const es = new EventSource('/api/events')

    es.addEventListener(event, () => cb.current())

    return () => es.close()
  }, [event])
}
