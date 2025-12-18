import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'sidebar-collapsed'

type SidebarContextState = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextState | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const setCollapsed = useCallback((value: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {}
    setCollapsedState(value)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
