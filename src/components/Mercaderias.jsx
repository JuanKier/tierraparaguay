import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllMercaderias, addMercaderia, updateMercaderia, deleteMercaderia } from '../db/database'

export default function Mercaderias({ user }) {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      alert('Acceso restringido')
      window.history.back()
      return
    }
    loadData()
  }, [])

  useSSE('data_changed', loadData)

  const loadData = async () => {
    const data = await getAllMercaderias()
    setItems(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    if (editing) {
      await updateMercaderia(editing.id, { nombre: nombre.trim() })
    } else {
      await addMercaderia({ nombre: nombre.trim() })
    }
    setNombre('')
    setShowForm(false)
    setEditing(null)
    loadData()
  }

  const handleEdit = (item) => {
    setNombre(item.nombre)
    setEditing(item)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta mercadería?')) {
      await deleteMercaderia(id)
      loadData()
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mercaderías / Servicios</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setNombre('') }}
          className="bg-primary-600 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition"
          title="Nueva Mercadería"
        >
          +
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {editing ? 'Editar' : 'Nueva'} Mercadería
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la mercadería"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium">
                {editing ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg text-sm font-medium">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{item.nombre}</p>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(item)} className="p-2 active:bg-gray-100 rounded" title="Editar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 active:bg-red-50 rounded" title="Eliminar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No hay mercaderías registradas</p>
        )}
      </div>
    </div>
  )
}
