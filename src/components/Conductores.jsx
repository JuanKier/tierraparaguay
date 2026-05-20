import { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { getAllUsers, addUser, updateUser, deleteUser, getAllVehiculos, getVehiculoById } from '../db/database'

export default function Conductores({ user }) {
  const [conductores, setConductores] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [usernameError, setUsernameError] = useState('')
  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    password: '',
    vehiculo_id: '',
    telefono: '',
    role: 'user',
    active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const u = await getAllUsers()
    setConductores(u)
    const v = await getAllVehiculos()
    setVehiculos(v)
  }

  useSSE('data_changed', loadData)

  const getVehiculoInfo = (id) => {
    const v = vehiculos.find(v => Number(v.id) === Number(id))
    if (!v) return null
    return `${v.tipo} - ${v.chapa || `${v.marca} ${v.modelo}`}`
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value }
      if (name === 'nombre_completo' && !prev.username_manually_edited) {
        const autoUser = value.toLowerCase().replace(/[\s]+/g, '_').replace(/[^a-z0-9_áéíóúñ]/g, '')
        updated.username = autoUser
      }
      if (name === 'username') {
        updated.username_manually_edited = true
      }
      return updated
    })
    if (name === 'username') {
      validateUsername(value)
    }
  }

  const validateUsername = (username) => {
    if (!username) {
      setUsernameError('')
      return
    }
    const exists = conductores.find(c =>
      c.username === username &&
      (!editingUser || Number(c.id) !== Number(editingUser.id))
    )
    setUsernameError(exists ? `El usuario "${username}" ya existe. Elija otro.` : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (usernameError) return

    const username = formData.username || formData.nombre_completo
      .toLowerCase()
      .replace(/[\s]+/g, '_')
      .replace(/[^a-z0-9_áéíóúñ]/g, '')

    let chapa = ''
    if (formData.vehiculo_id) {
      const v = await getVehiculoById(formData.vehiculo_id)
      if (v) chapa = v.chapa
    }

    const data = {
      nombre: formData.nombre_completo,
      nombre_completo: formData.nombre_completo,
      username,
      password: formData.password,
      vehiculo_id: formData.vehiculo_id,
      chapa,
      telefono: formData.telefono,
      role: formData.role,
      active: formData.active
    }

    if (editingUser) {
      await updateUser(editingUser.id, data)
    } else {
      await addUser(data)
    }

    setFormData({
      nombre_completo: '',
      username: '',
      password: '',
      vehiculo_id: '',
      telefono: '',
      role: 'user',
      active: true
    })
    setUsernameError('')
    setShowForm(false)
    setEditingUser(null)
    loadData()
  }

  const handleEdit = (conductor) => {
    setFormData({
      nombre_completo: conductor.nombre_completo || conductor.nombre,
      username: conductor.username || '',
      password: conductor.password,
      vehiculo_id: conductor.vehiculo_id || '',
      telefono: conductor.telefono || '',
      role: conductor.role,
      active: conductor.active
    })
    setEditingUser(conductor)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este conductor?')) {
      await deleteUser(id)
      loadData()
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conductores</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingUser(null)
            setFormData({ nombre_completo: '', username: '', password: '', vehiculo_id: '', telefono: '', role: 'user', active: true }); setUsernameError('')
          }}
          className="bg-primary-600 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition"
          title="Nuevo Conductor"
        >
          +
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {editingUser ? 'Editar' : 'Nuevo'} Conductor
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder="Nombre completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Usuario para iniciar sesión"
                className={`w-full px-3 py-2 border rounded-lg text-sm ${usernameError ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {usernameError && (
                <p className="text-xs text-red-600 mt-1">{usernameError}</p>
              )}
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              onFocus={(e) => { if (!e.target.value) setFormData(prev => ({ ...prev, telefono: '+595' })) }}
              placeholder="Teléfono (+595...)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              name="vehiculo_id"
              value={formData.vehiculo_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Sin vehículo asignado</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>{v.tipo} - {v.chapa || `${v.marca} ${v.modelo}`}</option>
              ))}
            </select>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
              {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              Activo
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium"
              >
                {editingUser ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingUser(null) }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {conductores.map(c => {
          const vehiculoInfo = getVehiculoInfo(c.vehiculo_id)
          return (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 active:bg-gray-50 dark:active:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{c.nombre_completo || c.nombre}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Usuario: {c.username}</p>
                  {vehiculoInfo && <p className="text-xs text-gray-600 dark:text-gray-400">Vehículo: {vehiculoInfo}</p>}
                  {c.telefono && <p className="text-xs text-gray-600 dark:text-gray-400">Tel: {c.telefono}</p>}
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {c.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {c.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-2 active:bg-gray-100 rounded"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-600 active:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {conductores.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No hay conductores registrados</p>
        )}
      </div>
    </div>
  )
}
