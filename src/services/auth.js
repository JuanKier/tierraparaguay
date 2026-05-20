import { getUserByUsername } from '../db/database'

export async function login(username, password) {
  const user = await getUserByUsername(username)
  if (!user || user.password !== password) {
    return { success: false, message: 'Usuario o contraseña incorrectos' }
  }
  if (!user.active) {
    return { success: false, message: 'Su cuenta de usuario no está habilitada. Por favor, comuníquese con administración.' }
  }
  return { success: true, user }
}

export function logout() {
  localStorage.removeItem('tierrapy_user')
}

export function getCurrentUser() {
  const saved = localStorage.getItem('tierrapy_user')
  return saved ? JSON.parse(saved) : null
}
