import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AuthUser } from '@/lib/auth'

type UsersResponse = { data: AuthUser[] }

export function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<UsersResponse>('/users'),
  })

  if (isLoading) return <p className="text-sm text-neutral-500">Loading users…</p>
  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <table className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Username</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((u) => (
            <tr key={u.id} className="border-t border-neutral-200">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">{u.username}</td>
              <td className="px-4 py-2">{u.role}</td>
              <td className="px-4 py-2">{u.isActive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
