import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllBoletas, getAllEmpresas } from '../db/database'

export default function Estadisticas({ user }) {
  const [boletas, setBoletas] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [periodo, setPeriodo] = useState('today')
  const [dateDesde, setDateDesde] = useState('')
  const [dateHasta, setDateHasta] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [b, e] = await Promise.all([getAllBoletas(), getAllEmpresas()])
    setBoletas(b || [])
    setEmpresas(e || [])
  }

  useSSE('data_changed', loadData)

  const getWeekRange = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) }
  }

  const filtered = boletas.filter(b => {
    if (periodo === 'all') return true
    if (periodo === 'range') {
      if (!dateDesde && !dateHasta) return true
      if (dateDesde && b.fecha < dateDesde) return false
      if (dateHasta && b.fecha > dateHasta) return false
      return true
    }
    const now = new Date()
    if (periodo === 'today') return b.fecha === now.toISOString().slice(0, 10)
    if (periodo === 'week') {
      const { from, to } = getWeekRange(new Date())
      return b.fecha >= from && b.fecha <= to
    }
    if (periodo === 'month') {
      return b.fecha.slice(0, 7) === now.toISOString().slice(0, 7)
    }
    if (periodo === 'year') return b.fecha.slice(0, 4) === String(now.getFullYear())
    return true
  })

  const totalBoletas = filtered.length

  const resumenByUnit = {}
  filtered.forEach(b => {
    let servicios = b.servicios || []
    if (typeof servicios === 'string') try { servicios = JSON.parse(servicios) } catch { servicios = [] }
    ;(Array.isArray(servicios) ? servicios : []).forEach(s => {
      const u = s.unidad || 'm3'
      const c = parseFloat(s.cantidad) || 0
      resumenByUnit[u] = (resumenByUnit[u] || 0) + c
    })
  })

  const unitLabels = { m3: 'm³ total', kg: 'Kg total', m2: 'm² total', horas: 'Horas total' }

  const byEmpresa = {}
  filtered.forEach(b => {
    const name = b.empresa_nombre || 'Sin empresa'
    if (!byEmpresa[name]) byEmpresa[name] = { count: 0, total_m3: 0 }
    byEmpresa[name].count++
    byEmpresa[name].total_m3 += parseFloat(b.total_m3) || 0
  })
  const sortedEmpresas = Object.entries(byEmpresa).sort((a, b) => b[1].count - a[1].count)

  const byMonth = {}
  boletas.forEach(b => {
    const m = b.fecha ? b.fecha.slice(0, 7) : 'sin-fecha'
    if (!byMonth[m]) byMonth[m] = 0
    byMonth[m]++
  })
  const sortedMonths = Object.keys(byMonth).sort()

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Estadísticas</h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
            <option value="all">Todo el historial</option>
            <option value="range">Rango de fechas</option>
          </select>
          {periodo === 'range' && (
            <>
              <input type="date" value={dateDesde} onChange={(e) => setDateDesde(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm" />
              <input type="date" value={dateHasta} onChange={(e) => setDateHasta(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm" />
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{totalBoletas}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Boletas</p>
        </div>
        {Object.entries(unitLabels).map(([unit, label]) => (
          <div key={unit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{(resumenByUnit[unit] || 0).toFixed(1)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Por empresa */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Por Empresa</h3>
        {sortedEmpresas.length === 0 ? (
          <p className="text-sm text-gray-500">Sin datos</p>
        ) : (
          <div className="space-y-2">
            {sortedEmpresas.map(([name, data]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 truncate">{name}</span>
                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                  {data.count} boletas · {data.total_m3.toFixed(1)} m³
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Por mes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Por Mes</h3>
        {sortedMonths.length === 0 ? (
          <p className="text-sm text-gray-500">Sin datos</p>
        ) : (
          <div className="space-y-2">
            {sortedMonths.map(m => (
              <div key={m} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{m}</span>
                <span className="text-gray-500 dark:text-gray-400">{byMonth[m]} boletas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
