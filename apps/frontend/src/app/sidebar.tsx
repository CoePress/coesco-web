import { Link, useLocation } from 'react-router-dom'
import { PanelLeft, Home, Settings, ClipboardPenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from '@/components/sidebar-provider'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: ClipboardPenLine, label: 'Forms', href: '/forms' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

const Sidebar = () => {
  const { collapsed, toggle } = useSidebar()
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex h-full flex-col border-r bg-sidebar transition-[width] duration-300 overflow-hidden',
          collapsed ? 'w-12' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between border-b p-2">
          <span className={cn(
            'font-semibold text-sidebar-foreground whitespace-nowrap overflow-hidden',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>Menu</span>
          <Button variant="ghost" size="icon-sm" onClick={toggle}>
            <PanelLeft className={cn('size-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="size-4 shrink-0" />
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex h-8 items-center gap-3 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </TooltipProvider>
  )
}

export default Sidebar