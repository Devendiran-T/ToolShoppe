import React, { createContext, useContext, useEffect } from 'react'

const Ctx = createContext(() => {})

export function DocLabelProvider({ setLabel, children }) {
  return <Ctx.Provider value={setLabel}>{children}</Ctx.Provider>
}

/** Detail screens call this so the breadcrumb ends with the document number. */
export function useDocLabel(label) {
  const set = useContext(Ctx)
  useEffect(() => {
    set(label || null)
    return () => set(null)
  }, [label, set])
}
