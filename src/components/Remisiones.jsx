import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllBoletas, getAllEmpresas, getAllUsers, getAllVehiculos } from '../db/database'

export default function Remisiones({ user }) {
  const navigate = useNavigate()
  const [boletas, setBoletas] = useState([])
  const [filtered, setFiltered] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [conductores, setConductores] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [verTodo, setVerTodo] = useState(false)
  const [filters, setFilters] = useState({
    empresa_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    conductor_id: '',
    vehiculo_id: ''
  })
  const isSuper = user.role === 'superadmin'

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, boletas, verTodo])

  const loadData = async () => {
    let [boletasData, empresasData, usersData, vehiculosData] = await Promise.all([
      getAllBoletas(),
      getAllEmpresas(),
      getAllUsers(),
      getAllVehiculos()
    ])
    if (user.role !== 'admin' && !isSuper) {
      boletasData = boletasData.filter(b => Number(b.conductor_id) === Number(user.id))
    }
    boletasData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setBoletas(boletasData)
    setEmpresas(empresasData)
    setConductores(usersData)
    setVehiculos(vehiculosData)
  }

  useSSE('data_changed', loadData)

  const getConductorNombre = (id) => {
    const c = conductores.find(c => Number(c.id) === Number(id))
    return c ? c.nombre_completo || c.nombre : ''
  }

  const getVehiculoChapa = (id) => {
    const v = vehiculos.find(v => Number(v.id) === Number(id))
    return v ? v.chapa || `${v.tipo} ${v.marca} ${v.modelo}` : ''
  }

  const applyFilters = () => {
    let result = [...boletas]
    if (isSuper && !verTodo) {
      result = result.filter(b => Number(b.conductor_id) === Number(user.id))
    }
    if (filters.empresa_id) {
      result = result.filter(b => Number(b.empresa_id) === Number(filters.empresa_id))
    }
    if (filters.fecha_desde) {
      result = result.filter(b => new Date(b.fecha) >= new Date(filters.fecha_desde))
    }
    if (filters.fecha_hasta) {
      result = result.filter(b => new Date(b.fecha) <= new Date(filters.fecha_hasta))
    }
    if (filters.conductor_id) {
      result = result.filter(b => Number(b.conductor_id) === Number(filters.conductor_id))
    }
    if (filters.vehiculo_id) {
      result = result.filter(b => {
        if (b.vehiculo_id) return Number(b.vehiculo_id) === Number(filters.vehiculo_id)
        const chapa = getVehiculoChapa(filters.vehiculo_id)
        return chapa && b.chapa === chapa
      })
    }
    setFiltered(result)
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({ empresa_id: '', fecha_desde: '', fecha_hasta: '', conductor_id: '', vehiculo_id: '' })
  }

  const exportToCSV = () => {
    const sep = ';'
    const getTotalsByUnit = (servicios) => {
      const totals = { m3: 0, kg: 0, m2: 0, horas: 0 }
      ;(servicios || []).forEach(s => {
        const u = s.unidad || 'm3'
        const c = parseFloat(s.cantidad) || 0
        if (totals[u] !== undefined) totals[u] += c
      })
      return totals
    }
    const headers = ['N°', 'Fecha', 'Empresa', 'Conductor', 'Vehículo/Chapa', 'Total m³', 'Total kg', 'Total m²', 'Total horas', 'Observación']
    const rows = filtered.map(b => {
      const totals = getTotalsByUnit(b.servicios)
      return [
        b.numero,
        b.fecha,
        `"${(b.empresa_nombre || '').replace(/"/g, '""')}"`,
        `"${(b.conductor_nombre || '').replace(/"/g, '""')}"`,
        `"${(b.vehiculo_label || b.chapa || '').replace(/"/g, '""')}"`,
        String(totals.m3).replace('.', ','),
        String(totals.kg).replace('.', ','),
        String(totals.m2).replace('.', ','),
        String(totals.horas).replace('.', ','),
        `"${(b.observacion || '').replace(/"/g, '""')}"`
      ].join(sep)
    })
    const csv = '\uFEFF' + [headers.join(sep), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `remisiones_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Remisiones</h2>
        {(user.role === 'admin' || user.role === 'superadmin') && filtered.length > 0 && (
          <button
            onClick={exportToCSV}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-95 transition flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Exportar CSV
          </button>
        )}
      </div>

      {isSuper && (
        <div className="flex items-center gap-2 mb-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={verTodo} onChange={() => setVerTodo(!verTodo)} />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Ver todo (todas las empresas)</span>
          </label>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Empresa</label>
            <select
              value={filters.empresa_id}
              onChange={(e) => handleFilterChange('empresa_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
            >
              <option value="">Todas</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fecha desde</label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Conductor</label>
            <select
              value={filters.conductor_id}
              onChange={(e) => handleFilterChange('conductor_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_completo || c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vehículo</label>
            <select
              value={filters.vehiculo_id}
              onChange={(e) => handleFilterChange('vehiculo_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>{v.tipo} - {v.chapa || `${v.marca} ${v.modelo}`}</option>
              ))}
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {hasActiveFilters ? 'No se encontraron remisiones con esos filtros' : 'No hay remisiones'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {filtered.length} remisión(es) encontrada(s)
          </p>
          {filtered.map(boleta => (
            <div
              key={boleta.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary-600 text-sm">#{boleta.numero}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(boleta.fecha).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Empresa:</span>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{boleta.empresa_nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Conductor:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{boleta.conductor_nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{boleta.vehiculo_label ? 'Vehículo' : 'Chapa'}:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{boleta.vehiculo_label || boleta.chapa}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{boleta.resumen_total || boleta.total_m3 + ' m3'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/boleta/${boleta.id}`)}
                  className="flex-1 bg-gray-800 dark:bg-gray-600 text-white py-2 rounded-lg text-xs font-medium active:scale-95 transition"
                >
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
