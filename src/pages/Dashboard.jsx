import { useNavigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { LOGO_BASE64 } from '../logobase64'
import { isSuperAdmin } from '../db/database'

export default function Dashboard({ user, onLogout, toggleDark }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = user.role === 'admin' || user.role === 'superadmin'

  const menuItems = [
    { path: '/', label: 'Boletas', adminOnly: false, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
    )},
    { path: '/nueva', label: 'Nueva Boleta', adminOnly: false, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
    )},
    { path: '/remisiones', label: 'Remisiones', adminOnly: false, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
    )},
    { path: '/vehiculos', label: 'Vehículos', adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    )},
    { path: '/conductores', label: 'Conductores', adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
    )},
    { path: '/empresas', label: 'Empresas', adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    )},
    { path: '/mercaderias', label: 'Mercaderías', adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    )},
    { path: '/settings', label: 'Configuración', adminOnly: true, superOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    )},
    { path: '/activity', label: 'Actividad', adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    )},
    { path: '/estadisticas', label: 'Estadísticas', adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
    )},
  ]

  const quickActions = [
    { path: '/nueva', label: 'Nueva Boleta', color: 'bg-primary-600', desc: 'Crear boleta de remision', adminOnly: false },
    { path: '/remisiones', label: 'Remisiones', color: 'bg-gray-800', desc: 'Buscar y filtrar remisiones', adminOnly: false },
    { path: '/vehiculos', label: 'Vehículos', color: 'bg-gray-700', desc: 'Gestionar vehículos', adminOnly: true },
    { path: '/conductores', label: 'Conductores', color: 'bg-gray-700', desc: 'Gestionar conductores', adminOnly: true },
    { path: '/empresas', label: 'Empresas', color: 'bg-gray-600', desc: 'Gestionar empresas', adminOnly: true },
    { path: '/mercaderias', label: 'Mercaderías', color: 'bg-gray-600', desc: 'Gestionar mercaderías', adminOnly: true },
    { path: '/activity', label: 'Actividad', color: 'bg-primary-700', desc: 'Registro de actividad', adminOnly: true },
    { path: '/estadisticas', label: 'Estadísticas', color: 'bg-primary-800', desc: 'Dashboard de estadísticas', adminOnly: true },
  ]

  const visibleQuickActions = quickActions.filter(item => {
    if (item.adminOnly) return isAdmin
    if (item.superOnly) return isSuperAdmin(user)
    return true
  })

  const visibleMenuItems = menuItems.filter(item => {
    if (item.superOnly) return isSuperAdmin(user)
    if (item.adminOnly) return isAdmin
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
               <img 
                 src={LOGO_BASE64} 
                  alt="Tierra Paraguay E.A.S" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Tierra Paraguay E.A.S</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Boletas de Remisión</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Modo oscuro"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {user.nombre} ({user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Usuario'})
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-16 lg:pt-0
          transition-transform duration-300 ease-in-out
        `}>
          <nav className="p-4 space-y-2">
            {visibleMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <span className="text-gray-600 dark:text-gray-300">{item.icon}</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {visibleQuickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white p-4 rounded-xl text-left active:scale-95 transition`}
              >
                <p className="font-bold text-sm">{action.label}</p>
                <p className="text-xs opacity-80 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
        DATAKIER &copy; 2026 - Todos los derechos reservados
      </footer>
    </div>
  )
}
