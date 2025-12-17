import { createContext, useContext, useState } from 'react'

type SidebarContextState = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextState | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = () => setCollapsed((prev) => !prev)

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
