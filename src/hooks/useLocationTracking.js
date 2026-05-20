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

    const getDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371000
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    }

    // Pedir permiso y empezar a trackear
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const prev = lastPos.current
        // Solo enviar si se movió más de 50m o es la primera vez
        if (!prev || getDistance(prev.lat, prev.lng, latitude, longitude) > 50) {
          lastPos.current = { lat: latitude, lng: longitude }
          sendLocation(latitude, longitude)
        }
      },
      () => {
        fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
          if (d.latitude && d.longitude) {
            lastPos.current = { lat: d.latitude, lng: d.longitude }
            sendLocation(d.latitude, d.longitude)
          }
        }).catch(() => {})
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )

    // Re-enviar ubicación cada 5 min (incluso sin movimiento, para mantener vigencia)
    intervalId.current = setInterval(() => {
      if (lastPos.current) {
        sendLocation(lastPos.current.lat, lastPos.current.lng)
      }
    }, 300000)

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      if (intervalId.current !== null) clearInterval(intervalId.current)
    }
  }, [user?.id])
}
