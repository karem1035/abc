import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { PlaceholderPage } from '@/pages/placeholder'
import { BookingsPage } from '@/pages/bookings'
import { UsersPage } from '@/pages/users'
import { ProfilePage } from '@/pages/profile'
import { AuditLogsPage } from '@/pages/audit-logs'
import { FaqsPage } from '@/pages/faqs'
import { ContactSubmissionsPage } from '@/pages/contact-submissions'
import { DepartmentEditPage } from '@/pages/department-edit'
import { DepartmentsPage } from '@/pages/departments'
import { DoctorsPage } from '@/pages/doctors'
import { DoctorEditPage } from '@/pages/doctor-edit'
import { useAuth, type UserRole } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="users"
          element={
            <RequireRole roles={['admin']}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RequireRole roles={['admin']}>
              <AuditLogsPage />
            </RequireRole>
          }
        />
        <Route path="bookings" element={<BookingsPage />} />
        <Route
          path="content"
          element={<PlaceholderPage title="Content" />}
        />
        <Route path="faqs" element={<FaqsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="departments/new" element={<DepartmentEditPage />} />
        <Route path="departments/:id/edit" element={<DepartmentEditPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:id" element={<DoctorEditPage />} />
        <Route path="contact-submissions" element={<ContactSubmissionsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
