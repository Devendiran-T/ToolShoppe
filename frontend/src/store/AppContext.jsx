import React, { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react'
import { reducer } from './reducer.js'
import { buildDemoState } from './seedRunner.js'
import { COLLECTIONS } from './seed.js'
import { authApi, fetchAllBackendData } from '../api/endpoints.js'
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

  const refreshFromBackend = useCallback(async () => {
    try {
      const bData = await fetchAllBackendData()
      if (bData && (bData.customers?.length > 0 || bData.customerRequests?.length > 0)) {
        dispatchLocal({
          type: 'RESET_DEMO',
          state: mapBackendToFrontend(bData, state),
        })
        setBackendConnected(true)
      }
    } catch (err) {
      console.warn('Backend sync notice (using local prototype state):', err.message || err)
    }
  }, [state])

  const login = async (user, pass) => {
    try {
      const res = await authApi.login(user, pass)
      if (res && res.access_token) {
        setIsAuth(true)
        localStorage.setItem('isAuth', 'true')
        setBackendConnected(true)
        setTimeout(refreshFromBackend, 100)
        return true
      }
    } catch (err) {
      console.warn('Backend auth unreachable, checking credentials:', err.message || err)
    }

    if (user === 'admin' && (pass === 'admin' || pass === 'admin123')) {
      setIsAuth(true)
      localStorage.setItem('isAuth', 'true')
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
    (action) => {
      dispatchLocal(action)
      syncActionToBackend(action, state).catch(() => {})
    },
    [state]
  )

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota */
    }
  }, [state])

  useEffect(() => {
    if (isAuth) {
      refreshFromBackend()
    }
  }, [isAuth])

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
