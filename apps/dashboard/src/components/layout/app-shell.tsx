import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LangSwitch } from '@/components/lang-switch'
import { useI18n } from '@/lib/i18n'

export function AppShell() {
  const { t } = useI18n()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-[family-name:var(--font-heading)] font-semibold">{t('app.name')}</span>
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <footer className="flex h-10 shrink-0 items-center justify-end border-t px-4">
          <LangSwitch />
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
