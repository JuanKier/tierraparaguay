import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllBoletas, deleteBoleta } from '../db/database'

export default function BoletasList({ user }) {
  const navigate = useNavigate()
  const [boletas, setBoletas] = useState([])
  const [filter, setFilter] = useState('todas')

  useEffect(() => {
    loadBoletas()
  }, [])

  const loadBoletas = async () => {
    let data = await getAllBoletas()
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      data = data.filter(b => Number(b.conductor_id) === Number(user.id))
    }
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setBoletas(data)
  }

  useSSE('data_changed', loadBoletas)

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (confirm('¿Eliminar esta boleta?')) {
      await deleteBoleta(id)
      loadBoletas()
    }
  }

  // No hay filtro por estado - solo historial

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Boletas</h2>
        <button
          onClick={() => navigate('/nueva')}
          className="bg-primary-600 hover:bg-primary-700 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition"
          title="Nueva Boleta"
        >
          +
        </button>
      </div>

      {/* Búsqueda o filtros adicionales pueden ir aquí */}

       {boletas.length === 0 ? (
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="text-4xl mb-3 font-bold text-primary-600">B</div>
           <p className="text-gray-500 dark:text-gray-400 mb-4">No hay boletas</p>
           <button
             onClick={() => navigate('/nueva')}
             className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
           >
             Crear Boleta
           </button>
         </div>
       ) : (
         <div className="space-y-3">
           {boletas.map(boleta => (
            <div
              key={boleta.id}
              onClick={() => navigate(`/boleta/${boleta.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 active:bg-gray-50 dark:active:bg-gray-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-primary-600 text-sm">#{boleta.numero}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(boleta.fecha).toLocaleDateString('es-ES')}
                  </span>
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <button
                      onClick={(e) => handleDelete(boleta.id, e)}
                      className="p-1.5 text-red-600 active:bg-red-50 dark:active:bg-red-900 rounded"
                      title="Eliminar"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Empresa:</span>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{boleta.empresa_nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{boleta.vehiculo_label ? 'Vehículo' : 'Chapa'}:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{boleta.vehiculo_label || boleta.chapa}</p>
                </div>
              </div>
              
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {boleta.resumen_total || boleta.total_m3 + ' m3'} • {boleta.conductor_nombre}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
