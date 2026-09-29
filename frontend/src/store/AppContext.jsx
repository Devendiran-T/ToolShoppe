import React, { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react'
import { reducer } from './reducer.js'
import { buildDemoState } from './seedRunner.js'
import { COLLECTIONS } from './seed.js'
import { authApi, fetchAllBackendData } from '../api/endpoints.js'
import { ensureAuthToken, checkBackendHealth } from '../api/client.js'
import { mapBackendToFrontend, syncActionToBackend } from './syncService.js'

const KEY = 'tools-supplier-prototype-v1'
const AppCtx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return buildDemoState()
    const parsed = JSON.parse(raw)
    // Guard against a stale shape from an older build of the prototype.
    if (!parsed || !parsed.counters || COLLECTIONS.some((c) => !Array.isArray(parsed[c]))) {
      return buildDemoState()
    }
    return parsed
  } catch {
    return buildDemoState()
  }
}

export function AppProvider({ children }) {
  const [state, dispatchLocal] = useReducer(reducer, undefined, load)
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('isAuth') === 'true')
  const [backendConnected, setBackendConnected] = useState(false)
  const stateRef = React.useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const refreshFromBackend = useCallback(async () => {
    try {
      await ensureAuthToken()
      const bData = await fetchAllBackendData()
      if (bData) {
        dispatchLocal({
          type: 'RESET_DEMO',
          state: mapBackendToFrontend(bData, stateRef.current),
        })
        setBackendConnected(true)
        return true
      }
    } catch (err) {
      console.warn('Backend sync notice:', err.message || err)
    }

    const isHealthy = await checkBackendHealth()
    setBackendConnected(isHealthy)
    return isHealthy
  }, [])

  const login = async (user, pass) => {
    try {
      const res = await authApi.login(user, pass)
      if (res && res.access_token) {
        setIsAuth(true)
        localStorage.setItem('isAuth', 'true')
        setBackendConnected(true)
        setTimeout(refreshFromBackend, 50)
        return true
      }
    } catch (err) {
      console.warn('Backend auth unreachable, checking credentials:', err.message || err)
    }

    if (user === 'admin' && (pass === 'admin' || pass === 'admin123')) {
      setIsAuth(true)
      localStorage.setItem('isAuth', 'true')
      ensureAuthToken().then(() => refreshFromBackend())
      return true
    }
    return false
  }

  const logout = () => {
    authApi.logout()
    setIsAuth(false)
    localStorage.removeItem('isAuth')
  }

  const dispatch = useCallback(
    async (action) => {
      dispatchLocal(action)
      try {
        await syncActionToBackend(action, stateRef.current)
        await refreshFromBackend()
      } catch (err) {
        console.warn('Action sync notice:', err)
      }
    },
    [refreshFromBackend]
  )

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota */
    }
  }, [state])

  useEffect(() => {
    let intervalId = null

    const initConnection = async () => {
      try {
        await ensureAuthToken()
        await refreshFromBackend()
      } catch (e) {
        console.warn('Initial connection attempt:', e)
      }
    }

    initConnection()

    // Continuously keep frontend and backend in sync every 15 seconds
    intervalId = setInterval(initConnection, 15000)

    const onWindowFocus = () => {
      initConnection()
    }
    window.addEventListener('focus', onWindowFocus)

    return () => {
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [refreshFromBackend])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      isAuth,
      login,
      logout,
      backendConnected,
      refreshFromBackend,
      resetDemo: () => dispatchLocal({ type: 'RESET_DEMO', state: buildDemoState() }),
      clearDocuments: () => dispatchLocal({ type: 'CLEAR_DOCUMENTS' }),
    }),
    [state, isAuth, backendConnected, dispatch, refreshFromBackend]
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function useStore() {
  return useApp().state
}
