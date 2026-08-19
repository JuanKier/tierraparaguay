import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  getBoletaById, addBoleta, updateBoleta, addEmpresa,
  getAllUsers, getAllEmpresas, getAllVehiculos, getAllMercaderias 
} from '../db/database'
import { getCurrentUser } from '../services/auth'
import { localDateString } from '../utils/format'

export default function BoletaForm({ user }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
      fecha: localDateString(), 
    conductor_id: user.id,
    conductor_nombre: user.nombre,
    chapa: user.chapa || '',
    vehiculo_label: '',
    empresa_id: '',
    empresa_nombre: '',
    direccion_entrega: '',
    telefono_empresa: '',
    factura_numero: '',
    observacion: ''
  })

  const [servicios, setServicios] = useState([
    { fecha: localDateString(), tipo_mercaderia: '', cantidad: '', unidad: 'm3', descripcion: '' }
  ])

  const [conductores, setConductores] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [mercaderias, setMercaderias] = useState([])
  const [showNewEmpresa, setShowNewEmpresa] = useState(false)
  const [newEmpresa, setNewEmpresa] = useState({ nombre: '', direccion: '', ruc: '', telefono: '' })

  useEffect(() => {
    loadData()
    if (isEditing) {
      loadBoleta()
    }
  }, [id])

  const loadData = async () => {
    const [users, empresasData, v, m] = await Promise.all([
      getAllUsers(), getAllEmpresas(), getAllVehiculos(), getAllMercaderias()
    ])
    setConductores(users.filter(u => u.active))
    setVehiculos(v)
    setEmpresas(empresasData)
    setMercaderias(m)
  }

  const loadBoleta = async () => {
    const boleta = await getBoletaById(id)
    if (boleta) {
      setFormData({
        fecha: boleta.fecha,
        conductor_id: boleta.conductor_id,
        conductor_nombre: boleta.conductor_nombre,
        chapa: boleta.chapa,
        vehiculo_label: boleta.vehiculo_label || '',
        empresa_id: boleta.empresa_id,
        empresa_nombre: boleta.empresa_nombre,
        direccion_entrega: boleta.direccion_entrega,
        factura_numero: boleta.factura_numero || '',
        observacion: boleta.observacion || ''
      })
      setServicios(boleta.servicios || [])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleServicioChange = (index, field, value) => {
    const newServicios = [...servicios]
    newServicios[index] = { ...newServicios[index], [field]: value }
    setServicios(newServicios)
  }

  const addServicio = () => {
    setServicios([...servicios, { 
    fecha: localDateString(),
      tipo_mercaderia: '', 
      cantidad: '', 
      unidad: 'm3', 
      descripcion: '' 
    }])
  }

  const removeServicio = (index) => {
    if (servicios.length > 1) {
      setServicios(servicios.filter((_, i) => i !== index))
    }
  }

  const handleEmpresaSelect = (e) => {
    const empresaId = e.target.value
    const empresa = empresas.find(emp => emp.id.toString() === empresaId)
    if (empresa) {
      setFormData(prev => ({ 
        ...prev, 
        empresa_id: empresa.id, 
        empresa_nombre: empresa.nombre,
        direccion_entrega: empresa.direccion,
        telefono_empresa: empresa.telefono || ''
      }))
    } else {
      setFormData(prev => ({ ...prev, empresa_id: '', empresa_nombre: '', direccion_entrega: '', telefono_empresa: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    
    const serviciosValidos = servicios.filter(s => s.cantidad && parseFloat(s.cantidad) > 0)
    if (serviciosValidos.length === 0) {
      alert('Debe agregar al menos un servicio con cantidad')
      setSaving(false)
      return
    }

    const totalPorUnidad = {}
    serviciosValidos.forEach(s => {
      const u = s.unidad || 'm3'
      totalPorUnidad[u] = (totalPorUnidad[u] || 0) + parseFloat(s.cantidad || 0)
    })
    const resumen_total = Object.entries(totalPorUnidad)
      .map(([u, c]) => `${c} ${u}`)
      .join(', ')

    const conductorSel = conductores.find(c => Number(c.id) === Number(formData.conductor_id))
    let vehiculo_label = ''
    if (!formData.chapa && conductorSel?.vehiculo_id) {
      const v = vehiculos.find(v => Number(v.id) === Number(conductorSel.vehiculo_id))
      if (v) vehiculo_label = `${v.tipo} ${v.marca} ${v.modelo}`
    }

    const boletaData = {
      ...formData,
      servicios: serviciosValidos,
      total_m3: Object.values(totalPorUnidad).reduce((a, b) => a + b, 0),
      resumen_total,
      vehiculo_label,
      fecha: localDateString()
    }

    try {
      if (isEditing) {
        await updateBoleta(id, boletaData)
        navigate('/')
      } else {
        const newBoleta = await addBoleta(boletaData)
        navigate('/boleta/' + newBoleta.id)
      }
    } catch (e) {
      console.error('Error saving boleta:', e)
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-6 mb-8 ml-2">
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm font-medium active:scale-95 transition"
        >
          Volver
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Boleta' : 'Nueva Boleta de Remisión'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
        {/* Fecha (fija = hoy) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Conductor (solo lectura para usuarios normales) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Conductor</label>
          <select
            name="conductor_id"
            value={formData.conductor_id}
            onChange={(e) => {
              const conductor = conductores.find(c => c.id.toString() === e.target.value)
              let chapa = conductor.chapa || ''
              let vehiculo_label = ''
              if (conductor.vehiculo_id) {
                const v = vehiculos.find(v => Number(v.id) === Number(conductor.vehiculo_id))
                if (v) {
                  chapa = v.chapa || ''
                  if (!chapa) vehiculo_label = `${v.tipo} ${v.marca} ${v.modelo}`
                }
              }
              setFormData(prev => ({ 
                ...prev, 
                conductor_id: conductor.id,
                conductor_nombre: conductor.nombre,
                chapa,
                vehiculo_label
              }))
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={user.role !== 'admin' && user.role !== 'superadmin'}
          >
            {conductores.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Chapa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Vehículo</label>
          <input
            type="text"
            name="chapa"
            value={formData.chapa || formData.vehiculo_label || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Chapa del vehículo (opcional)"
          />
          {!formData.chapa && formData.vehiculo_label && (
            <p className="text-xs text-gray-500 mt-1">Vehículo asignado: {formData.vehiculo_label}</p>
          )}
        </div>

        {/* Empresa */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
            {(user.role === 'admin' || user.role === 'superadmin') && (
              <button
                type="button"
                onClick={() => setShowNewEmpresa(!showNewEmpresa)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {showNewEmpresa ? 'Cancelar' : '+ Nueva empresa'}
              </button>
            )}
          </div>
          {showNewEmpresa && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <input
                type="text"
                placeholder="Nombre"
                value={newEmpresa.nombre}
                onChange={(ev) => setNewEmpresa(prev => ({ ...prev, nombre: ev.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={newEmpresa.direccion}
                onChange={(ev) => setNewEmpresa(prev => ({ ...prev, direccion: ev.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="RUC"
                value={newEmpresa.ruc}
                onChange={(ev) => setNewEmpresa(prev => ({ ...prev, ruc: ev.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={newEmpresa.telefono}
                onChange={(ev) => setNewEmpresa(prev => ({ ...prev, telefono: ev.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newEmpresa.nombre.trim()) return alert('Ingrese un nombre')
                  const created = await addEmpresa(newEmpresa)
                  if (created) {
                    const updated = await getAllEmpresas()
                    setEmpresas(updated)
                    setFormData(prev => ({
                      ...prev,
                      empresa_id: created.id,
                      empresa_nombre: created.nombre,
                      direccion_entrega: created.direccion || '',
                      telefono_empresa: created.telefono || ''
                    }))
                    setShowNewEmpresa(false)
                    setNewEmpresa({ nombre: '', direccion: '', ruc: '', telefono: '' })
                  }
                }}
                className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium"
              >
                Crear Empresa
              </button>
            </div>
          )}
          <select
            value={formData.empresa_id}
            onChange={handleEmpresaSelect}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Seleccionar empresa...</option>
            {empresas.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        {/* Dirección de entrega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Dirección de Entrega</label>
          <input
            type="text"
            name="direccion_entrega"
            value={formData.direccion_entrega}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Dirección completa"
            required
          />
        </div>

        {/* Factura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Número de Factura (opcional)</label>
          <input
            type="text"
            name="factura_numero"
            value={formData.factura_numero}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Ej: 001-001-0000123"
          />
        </div>

        {/* Servicios */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Servicios</h3>
            <button
              type="button"
              onClick={addServicio}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Agregar servicio
            </button>
          </div>

          {servicios.map((servicio, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Servicio #{index + 1}</span>
                {servicios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeServicio(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={servicio.fecha}
                    onChange={(e) => handleServicioChange(index, 'fecha', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Mercadería</label>
                  <select
                    value={servicio.tipo_mercaderia}
                    onChange={(e) => handleServicioChange(index, 'tipo_mercaderia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {mercaderias.map(m => (
                      <option key={m.id} value={m.nombre.toLowerCase()}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={servicio.cantidad}
                    onChange={(e) => handleServicioChange(index, 'cantidad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Unidad</label>
                  <select
                    value={servicio.unidad}
                    onChange={(e) => handleServicioChange(index, 'unidad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="m3">m³</option>
                    <option value="m2">m²</option>
                    <option value="kg">Kg</option>
                    <option value="horas">Horas</option>
                    <option value="carga">Carga</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={servicio.descripcion}
                  onChange={(e) => handleServicioChange(index, 'descripcion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Detalles adicionales"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Observación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Observación (opcional)</label>
          <textarea
            name="observacion"
            value={formData.observacion}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEditing ? 'Actualizar Boleta' : 'Crear Boleta'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
