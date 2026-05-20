import { useState, useEffect } from 'react'
import { exportDatabase, importDatabase, getLocalActivity } from '../db/database'

export default function Settings({ user }) {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [backupLogs, setBackupLogs] = useState([])

  useEffect(() => {
    const logs = getLocalActivity()
    setBackupLogs(logs.filter(l => l.action === 'backup' || l.entity_type === 'backup'))
  }, [])

  const handleExport = async () => {
    try {
      const data = await exportDatabase()
      const json = JSON.stringify(data, null, 2)
      const nombre = `tierrapy-backup-${new Date().toISOString().split('T')[0]}.json`
      let shared = false
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { Share } = await import('@capacitor/share')
        await Filesystem.writeFile({
          path: nombre,
          data: json,
          directory: Directory.Cache
        })
        const fileUri = await Filesystem.getUri({
          path: nombre,
          directory: Directory.Cache
        })
        await Share.share({
          title: 'Copia de seguridad Tierrapy',
          files: [fileUri.uri],
          dialogTitle: 'Compartir base de datos'
        })
        shared = true
      } catch {}
      if (!shared) {
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = nombre
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      setMessage('Base de datos exportada correctamente')
      setError('')
      const { logActivity } = await import('../db/database')
      logActivity('backup', 'backup', null, { filename: nombre }).catch(() => {})
      const logs = getLocalActivity()
      setBackupLogs(logs.filter(l => l.action === 'backup' || l.entity_type === 'backup'))
    } catch (e) {
      setError('Error al exportar: ' + e.message)
      setMessage('')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setMessage('')
    setError('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importDatabase(data)
      setMessage('Base de datos importada correctamente. Recargue la app para ver los cambios.')
      setError('')
    } catch (e) {
      setError('Error al importar: ' + e.message)
      setMessage('')
    }
    setImporting(false)
    e.target.value = ''
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configuración</h2>

      <div className="space-y-4">
        {backupLogs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Historial de Copias</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {backupLogs.slice(0, 20).map((log, i) => (
                <p key={i} className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(log.created_at).toLocaleString('es-ES')}
                  {log.details?.filename ? ` — ${log.details.filename}` : ''}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Base de Datos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Exporte la base de datos para hacer una copia de seguridad o transferirla a otro dispositivo.
            Al importar, los datos actuales serán reemplazados completamente.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleExport}
              className="bg-primary-600 text-white py-3 px-4 rounded-lg text-sm font-medium active:scale-95 transition"
            >
              Exportar Base de Datos
            </button>
            <label className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 px-4 rounded-lg text-sm font-medium text-center cursor-pointer active:scale-95 transition">
              {importing ? 'Importando...' : 'Importar Base de Datos'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>
          {message && (
            <div className="mt-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-2 rounded-lg text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
