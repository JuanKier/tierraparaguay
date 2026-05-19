import { useState, useEffect } from 'react'
import { getAllVehiculos, addVehiculo, updateVehiculo, deleteVehiculo, getAllUsers } from '../db/database'

export default function Vehiculos({ user }) {
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    color: '',
    chapa: '',
    conductor_id: ''
  })

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      alert('Acceso restringido')
      window.history.back()
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    const v = await getAllVehiculos()
    setVehiculos(v)
    const c = await getAllUsers()
    setConductores(c)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editing) {
      await updateVehiculo(editing.id, formData)
    } else {
      await addVehiculo(formData)
    }
    setFormData({ tipo: '', marca: '', modelo: '', color: '', chapa: '', conductor_id: '' })
    setShowForm(false)
    setEditing(null)
    loadData()
  }

  const handleEdit = (v) => {
    setFormData({
      tipo: v.tipo || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      color: v.color || '',
      chapa: v.chapa || '',
      conductor_id: v.conductor_id || ''
    })
    setEditing(v)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este vehículo?')) {
      await deleteVehiculo(id)
      loadData()
    }
  }

  const getConductorNombre = (id) => {
    const c = conductores.find(c => Number(c.id) === Number(id))
    return c ? c.nombre : '-'
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehículos</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditing(null)
            setFormData({ tipo: '', marca: '', modelo: '', color: '', chapa: '', conductor_id: '' })
          }}
          className="bg-primary-600 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition"
          title="Nuevo Vehículo"
        >
          +
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {editing ? 'Editar' : 'Nuevo'} Vehículo
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Tipo (Camión, Camioneta, etc.)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            <input type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="Marca" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Modelo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Color" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            <input type="text" name="chapa" value={formData.chapa} onChange={handleChange} placeholder="Chapa" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            <select name="conductor_id" value={formData.conductor_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Sin conductor asignado</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
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

      <div className="space-y-3">
        {vehiculos.map(v => (
          <div key={v.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{v.tipo} - {v.marca} {v.modelo}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Chapa: {v.chapa} | Color: {v.color}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Conductor: {getConductorNombre(v.conductor_id)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(v)} className="p-2 active:bg-gray-100 rounded" title="Editar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 active:bg-red-50 rounded" title="Eliminar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {vehiculos.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No hay vehículos registrados</p>
        )}
      </div>
    </div>
  )
}
