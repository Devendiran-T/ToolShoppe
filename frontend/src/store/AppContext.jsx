import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { reducer } from './reducer.js'
import { buildDemoState } from './seedRunner.js'
import { COLLECTIONS } from './seed.js'

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
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('isAuth') === 'true')

  const login = (user, pass) => {
    if (user === 'admin' && pass === 'admin') {
      setIsAuth(true)
      localStorage.setItem('isAuth', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuth(false)
    localStorage.removeItem('isAuth')
  }

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota — the prototype keeps working from memory */
    }
  }, [state])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      isAuth,
      login,
      logout,
      resetDemo: () => dispatch({ type: 'RESET_DEMO', state: buildDemoState() }),
      clearDocuments: () => dispatch({ type: 'CLEAR_DOCUMENTS' }),
    }),
    [state, isAuth]
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
