import { useEffect, useState } from 'react'
import Versions from './components/Versions'

function App() {
  const [dbMeta, setDbMeta] = useState({
    status: 'checking...',
    sqliteVersion: 'loading...',
    tableCount: 'loading...'
  })

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  useEffect(() => {
    let cancelled = false

    async function loadDbMeta() {
      try {
        const result = await window.api?.getDbMeta?.()

        if (!cancelled) {
          setDbMeta({
            status: result?.ok ? 'ok' : 'error',
            sqliteVersion: result?.sqliteVersion ?? 'unknown',
            tableCount: result?.tableCount ?? 'unknown'
          })
        }
      } catch (err) {
        if (!cancelled) {
          setDbMeta({
            status: 'error',
            sqliteVersion: 'error',
            tableCount: 'error'
          })
        }
      }
    }

    loadDbMeta()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <h1>DB bridge: {dbMeta.status}</h1>
      <p>SQLite version: {dbMeta.sqliteVersion}</p>
      <p>Table count: {dbMeta.tableCount}</p>
      <button onClick={ipcHandle}>Ping</button>
      <Versions></Versions>
    </>
  )
}

export default App