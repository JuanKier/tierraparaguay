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
  const [filters, setFilters] = useState({
    empresa_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    conductor_id: '',
    vehiculo_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useSSE('data_changed', loadData)

  useEffect(() => {
    applyFilters()
  }, [filters, boletas])

  const loadData = async () => {
    let [boletasData, empresasData, usersData, vehiculosData] = await Promise.all([
      getAllBoletas(),
      getAllEmpresas(),
      getAllUsers(),
      getAllVehiculos()
    ])
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      boletasData = boletasData.filter(b => Number(b.conductor_id) === Number(user.id))
    }
    boletasData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setBoletas(boletasData)
    setEmpresas(empresasData)
    setConductores(usersData)
    setVehiculos(vehiculosData)
  }

  const getConductorNombre = (id) => {
    const c = conductores.find(c => Number(c.id) === Number(id))
    return c ? c.nombre_completo || c.nombre : ''
  }

  const getVehiculoChapa = (id) => {
    const v = vehiculos.find(v => Number(v.id) === Number(id))
    return v ? v.chapa : ''
  }

  const applyFilters = () => {
    let result = [...boletas]
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

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Remisiones</h2>
      </div>

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
                <option key={v.id} value={v.id}>{v.tipo} - {v.chapa} ({v.marca})</option>
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
