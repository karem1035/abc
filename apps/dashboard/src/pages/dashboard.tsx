import { useAuth } from '@/lib/auth'

export function DashboardPage() {
  const { user } = useAuth()
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Welcome, {user?.name}</h1>
      <p className="text-sm text-neutral-500">
        Signed in as <span className="font-medium">{user?.username}</span> ({user?.role}).
      </p>
      <p className="text-sm text-neutral-500">
        This is a scaffold — module pages will be added in the next steps.
      </p>
    </div>
  )
}
