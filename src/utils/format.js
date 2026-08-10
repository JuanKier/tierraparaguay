// Fecha local en formato YYYY-MM-DD (usa hora local, no UTC)
export function localDateString(date = new Date()) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Formatear fecha a YYYY-MM-DD
export function formatDate(date) {
  if (!date) return ''
  return localDateString(date)
}

// Formatear fecha para mostrar
export function formatDisplayDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Formatear número a m3
export function formatM3(value) {
  if (!value) return '0 m³'
  return `${parseFloat(value).toFixed(2)} m³`
}

// Capitalizar primera letra
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Formatear número de teléfono Paraguay
export function formatPhonePhone(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 9) {
    return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6)}`
  }
  return phone
}
