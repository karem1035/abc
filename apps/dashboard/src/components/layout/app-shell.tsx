import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LangSwitch } from '@/components/lang-switch'
import { useI18n } from '@/lib/i18n'

export function AppShell() {
  const { t } = useI18n()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-[family-name:var(--font-heading)] font-semibold">{t('app.name')}</span>
          <div className="ms-auto flex items-center gap-1">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </header>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            <Outlet />
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}
