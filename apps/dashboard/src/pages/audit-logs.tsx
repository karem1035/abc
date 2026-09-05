import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

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
  const { t, locale } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api<AuditLogsResponse>('/audit-logs?limit=50'),
  })

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{t('audit.title')}</h1>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.when')}</TableHead>
                <TableHead>{t('audit.actor')}</TableHead>
                <TableHead>{t('audit.action')}</TableHead>
                <TableHead>{t('audit.entity')}</TableHead>
                <TableHead>{t('audit.ip')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                  </TableCell>
                  <TableCell>{log.actorUsername ?? '—'}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    {log.entity}
                    {log.entityId ? ` (${log.entityId.slice(0, 8)})` : ''}
                  </TableCell>
                  <TableCell>{log.ip ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
