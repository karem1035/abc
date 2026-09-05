import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, ScrollText, Stethoscope, LayoutDashboard, Newspaper, UserRound, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth, type UserRole } from '@/lib/auth'
import { useI18n, type TranslationKey } from '@/lib/i18n'

type NavItem = {
  to: string
  labelKey: TranslationKey
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const navMain: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/users', labelKey: 'nav.users', icon: Users, roles: ['admin'] },
  { to: '/audit-logs', labelKey: 'nav.auditLogs', icon: ScrollText, roles: ['admin'] },
  { to: '/bookings', labelKey: 'nav.bookings', icon: Stethoscope },
  { to: '/content', labelKey: 'nav.content', icon: Newspaper },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const visible = navMain.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <img src="/abc-logo.webp" alt="ABC" className="h-8 w-8 rounded-md object-contain" />
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight">
            ABC
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('app.name')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton isActive={location.pathname === item.to} render={<Link to={item.to} />}>
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton />}>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/15 text-[0.65rem] font-bold text-primary">
                      {user?.name?.slice(0, 2).toUpperCase() ?? '—'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user?.name}</span>
                  <ChevronDown className="ms-auto h-4 w-4 opacity-50 rtl:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span>{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.username} · {user?.role}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserRound className="h-4 w-4" />
                  {t('action.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t('action.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
