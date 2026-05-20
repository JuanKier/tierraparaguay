import { useState, useEffect, useRef } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllUsers } from '../db/database'

const API = import.meta.env.VITE_API_URL || '/api'

export default function MapaConductores({ user }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef({})
  const [ubicaciones, setUbicaciones] = useState([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const loadUbicaciones = async () => {
    try {
      const r = await fetch(API + '/ubicaciones')
      if (r.ok) setUbicaciones(await r.json())
    } catch {}
  }

  useEffect(() => { loadUbicaciones() }, [])

  useEffect(() => {
    const interval = setInterval(loadUbicaciones, 15000)
    return () => clearInterval(interval)
  }, [])

  useSSE('data_changed', loadUbicaciones)

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    if (typeof window.L !== 'undefined') { setLeafletLoaded(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Inicializar mapa
  useEffect(() => {
    if (!leafletLoaded || mapInstance.current) return
    const L = window.L
    mapInstance.current = L.map(mapRef.current).setView([-25.263, -57.575], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance.current)
  }, [leafletLoaded])

  // Actualizar marcadores
  useEffect(() => {
    if (!leafletLoaded || !mapInstance.current) return
    const L = window.L

    // Remover marcadores que ya no están
    Object.keys(markersRef.current).forEach(id => {
      if (!ubicaciones.find(u => Number(u.conductor_id) === Number(id))) {
        mapInstance.current.removeLayer(markersRef.current[id])
        delete markersRef.current[id]
      }
    })

    // Agregar/actualizar marcadores
    ubicaciones.forEach(u => {
      const cid = String(u.conductor_id)
      if (markersRef.current[cid]) {
        markersRef.current[cid].setLatLng([u.lat, u.lng])
      } else {
        const marker = L.marker([u.lat, u.lng]).addTo(mapInstance.current)
        marker.bindPopup(`<b>${u.conductor_nombre}</b><br/>${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}`)
        markersRef.current[cid] = marker
      }
    })

    // Ajustar vista si hay marcadores
    const ids = Object.keys(markersRef.current)
    if (ids.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current))
      mapInstance.current.fitBounds(group.getBounds().pad(0.2))
    }
  }, [ubicaciones, leafletLoaded])

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mapa de Conductores</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {ubicaciones.length} conductor(es) activo(s) — ubicaciones actualizadas cada 15s
        </p>
      </div>

      <div ref={mapRef} className="w-full rounded-xl shadow-sm border border-gray-100 dark:border-gray-700" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }} />

      {!leafletLoaded && (
        <div className="text-center py-8 text-gray-500">Cargando mapa...</div>
      )}

      {/* Lista de conductores activos */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Conductores activos</h3>
        {ubicaciones.length === 0 ? (
          <p className="text-sm text-gray-500">Sin ubicaciones</p>
        ) : (
          <div className="space-y-2">
            {ubicaciones.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {u.conductor_nombre}
                </span>
                <span className="text-xs text-gray-500">
                  {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
