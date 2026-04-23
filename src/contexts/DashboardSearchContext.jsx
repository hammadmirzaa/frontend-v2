import { createContext, useContext, useMemo, useState } from 'react'

const DashboardSearchContext = createContext({
  query: '',
  setQuery: () => {},
})

export function DashboardSearchProvider({ children }) {
  const [query, setQuery] = useState('')
  const value = useMemo(() => ({ query, setQuery }), [query])
  return <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>
}

export function useDashboardSearch() {
  return useContext(DashboardSearchContext)
}
