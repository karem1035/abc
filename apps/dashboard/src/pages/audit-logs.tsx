import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

type AuditLog = {
  id: string
  actorUsername: string | null
  action: string
  entity: string
  entityId: string | null
  ip: string | null
  createdAt: string
}

type AuditLogsResponse = { data: AuditLog[]; page: number; limit: number }

export function AuditLogsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api<AuditLogsResponse>('/audit-logs?limit=50'),
  })

  if (isLoading) return <p className="text-sm text-neutral-500">Loading audit logs…</p>
  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit Logs</h1>
      <table className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Actor</th>
            <th className="px-4 py-2 font-medium">Action</th>
            <th className="px-4 py-2 font-medium">Entity</th>
            <th className="px-4 py-2 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((log) => (
            <tr key={log.id} className="border-t border-neutral-200">
              <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2">{log.actorUsername ?? '—'}</td>
              <td className="px-4 py-2">{log.action}</td>
              <td className="px-4 py-2">
                {log.entity}
                {log.entityId ? ` (${log.entityId.slice(0, 8)})` : ''}
              </td>
              <td className="px-4 py-2">{log.ip ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
