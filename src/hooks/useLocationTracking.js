import { useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

export function useLocationTracking(user) {
  const watchId = useRef(null)
  const intervalId = useRef(null)
  const lastPos = useRef(null)

  useEffect(() => {
    if (!user || !navigator.geolocation) return

    const sendLocation = (lat, lng) => {
      fetch(API + '/ubicacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conductor_id: user.id,
          conductor_nombre: user.nombre || user.username,
          lat,
          lng
        })
      }).catch(() => {})
    }

    // Pedir permiso y empezar a trackear
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        lastPos.current = { lat: latitude, lng: longitude }
        sendLocation(latitude, longitude)
      },
      () => {
        // Si falla GPS, intentar una vez con IP aproximada
        fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
          if (d.latitude && d.longitude) {
            lastPos.current = { lat: d.latitude, lng: d.longitude }
            sendLocation(d.latitude, d.longitude)
          }
        }).catch(() => {})
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    // Re-enviar ubicación cada 20s por si el watchPosition no dispara seguido
    intervalId.current = setInterval(() => {
      if (lastPos.current) {
        sendLocation(lastPos.current.lat, lastPos.current.lng)
      }
    }, 20000)

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      if (intervalId.current !== null) clearInterval(intervalId.current)
    }
  }, [user?.id])
}
