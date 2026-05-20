import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getActivity } from '../db/database'

export default function ActivityLogs({ user }) {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState({ action: '', entity: '' })

  useEffect(() => { loadLogs() }, [])

  const loadLogs = async () => {
    const data = await getActivity()
    setLogs(data || [])
  }

  useSSE('data_changed', loadLogs)

  const filtered = logs.filter(l => {
    if (filter.action && l.action !== filter.action) return false
    if (filter.entity && l.entity_type !== filter.entity) return false
    return true
  })

  const actionLabels = { create: 'Creó', update: 'Modificó', delete: 'Eliminó' }
  const entityLabels = { user: 'Usuario', boleta: 'Boleta', empresa: 'Empresa', vehiculo: 'Vehículo', mercaderia: 'Mercadería' }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Registro de Actividad</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <select
            value={filter.action}
            onChange={(e) => setFilter(f => ({ ...f, action: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          >
            <option value="">Todas las acciones</option>
            <option value="create">Creación</option>
            <option value="update">Modificación</option>
            <option value="delete">Eliminación</option>
          </select>
          <select
            value={filter.entity}
            onChange={(e) => setFilter(f => ({ ...f, entity: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          >
            <option value="">Todas las entidades</option>
            <option value="user">Usuario</option>
            <option value="boleta">Boleta</option>
            <option value="empresa">Empresa</option>
            <option value="vehiculo">Vehículo</option>
            <option value="mercaderia">Mercadería</option>
          </select>
          <span className="text-sm text-gray-500 self-center">{filtered.length} registro(s)</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay registros de actividad</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log, i) => (
            <div key={log.id || i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {actionLabels[log.action] || log.action}
                  {' '}
                  <span className="text-primary-600">{entityLabels[log.entity_type] || log.entity_type}</span>
                  {log.entity_id ? <span className="text-gray-400"> #{log.entity_id}</span> : ''}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString('es-ES')}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {log.username} — {log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ') : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
