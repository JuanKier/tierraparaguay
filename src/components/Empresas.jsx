import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllEmpresas, addEmpresa, updateEmpresa, deleteEmpresa } from '../db/database'

export default function Empresas({ user }) {
  const [empresas, setEmpresas] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ruc: '',
    telefono: ''
  })

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      alert('Acceso restringido')
      window.history.back()
      return
    }
    loadEmpresas()
  }, [])

  useSSE('data_changed', loadEmpresas)

  const loadEmpresas = async () => {
    const data = await getAllEmpresas()
    setEmpresas(data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingEmpresa) {
      await updateEmpresa(editingEmpresa.id, formData)
    } else {
      await addEmpresa(formData)
    }
    
    setFormData({ nombre: '', direccion: '', ruc: '', telefono: '' })
    setShowForm(false)
    setEditingEmpresa(null)
    loadEmpresas()
  }

  const handleEdit = (empresa) => {
    setFormData({
      nombre: empresa.nombre,
      direccion: empresa.direccion || '',
      ruc: empresa.ruc || '',
      telefono: empresa.telefono || ''
    })
    setEditingEmpresa(empresa)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta empresa?')) {
      await deleteEmpresa(id)
      loadEmpresas()
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Empresas</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingEmpresa(null)
            setFormData({ nombre: '', direccion: '', ruc: '', telefono: '' })
          }}
          className="bg-primary-600 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition"
          title="Nueva Empresa"
        >
          +
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {editingEmpresa ? 'Editar' : 'Nueva'} Empresa
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre de la empresa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Dirección"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              name="ruc"
              value={formData.ruc}
              onChange={handleChange}
              placeholder="RUC (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Teléfono (para WhatsApp)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium"
              >
                {editingEmpresa ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingEmpresa(null) }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {empresas.map(emp => (
          <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{emp.nombre}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{emp.direccion}</p>
                {emp.ruc && <p className="text-xs text-gray-500 dark:text-gray-400">RUC: {emp.ruc}</p>}
                {emp.telefono && <p className="text-xs text-gray-500 dark:text-gray-400">Tel: {emp.telefono}</p>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(emp)}
                  className="p-2 active:bg-gray-100 rounded"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-2 text-red-600 active:bg-red-50 rounded"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {empresas.length === 0 && !showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="text-4xl mb-3 font-bold text-primary-600">E</div>
            <p className="text-gray-500 dark:text-gray-400">No hay empresas</p>
          </div>
        )}
      </div>
    </div>
  )
}
