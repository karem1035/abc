import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth, type UserRole } from '@/lib/auth'

type NavItem = { to: string; label: string; roles?: UserRole[] }

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users', roles: ['admin'] },
  { to: '/audit-logs', label: 'Audit Logs', roles: ['admin'] },
  { to: '/bookings', label: 'Bookings' },
  { to: '/content', label: 'Content' },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visible = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  return (
    <div className="flex min-h-svh bg-neutral-50 text-neutral-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4 text-sm font-semibold tracking-tight">
          ABC Dashboard
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                isActive ? 'bg-neutral-100' : 'hover:bg-neutral-100'
              }`
            }
          >
            <User className="h-4 w-4" />
            {user?.name}
          </NavLink>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
