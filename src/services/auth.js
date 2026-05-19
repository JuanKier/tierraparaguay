import { getUserByUsername } from '../db/database'

export async function login(username, password) {
  const user = await getUserByUsername(username)
  if (user && user.password === password && user.active) {
    return { success: true, user }
  }
  return { success: false, message: 'Usuario o contraseña incorrectos' }
}

export function logout() {
  localStorage.removeItem('tierrapy_user')
}

export function getCurrentUser() {
  const saved = localStorage.getItem('tierrapy_user')
  return saved ? JSON.parse(saved) : null
}
