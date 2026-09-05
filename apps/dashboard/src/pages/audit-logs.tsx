import { Fragment, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  FileUp,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { formatDateTime } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DEFAULT_PAGE_SIZE,
  TablePagination,
} from '@/components/shared/table-pagination'
import { cn } from '@/lib/utils'

type AuditLog = {
  id: string
  actorId: string | null
  actorUsername: string | null
  action: string
  entity: string
  entityId: string | null
  metadata: Record<string, unknown>
  ip: string | null
  createdAt: string
}

type AuditLogsResponse = {
  data: AuditLog[]
  page: number
  limit: number
  total: number
}

/** Icon + badge tone per audit action family. */
const actionStyle: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'auth.login': { icon: LogIn, tone: 'secondary' },
  'auth.logout': { icon: LogOut, tone: 'secondary' },
  'user.created': { icon: UserPlus, tone: 'default' },
  'user.updated': { icon: Pencil, tone: 'outline' },
  'user.deleted': { icon: Trash2, tone: 'destructive' },
  'profile.updated': { icon: Pencil, tone: 'outline' },
  'profile.password_changed': { icon: KeyRound, tone: 'outline' },
  'media.uploaded': { icon: FileUp, tone: 'default' },
  'media.deleted': { icon: Trash2, tone: 'destructive' },
}

const defaultActionStyle = { icon: ShieldCheck, tone: 'outline' as const }

export function AuditLogsPage() {
  const { t, tLabel } = useI18n()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, pageSize],
    queryFn: () => api<AuditLogsResponse>(`/audit-logs?page=${page}&limit=${pageSize}`),
    placeholderData: keepPreviousData,
  })


  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{t('audit.title')}</h1>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t('audit.when')}</TableHead>
                  <TableHead>{t('audit.actor')}</TableHead>
                  <TableHead>{t('audit.action')}</TableHead>
                  <TableHead>{t('audit.entity')}</TableHead>
                  <TableHead>{t('audit.ip')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('audit.noResults')}
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((log) => {
                  const style = actionStyle[log.action] ?? defaultActionStyle
                  const isOpen = expanded === log.id
                  const metaEntries = Object.entries(log.metadata ?? {})
                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : log.id)}
                      >
                        <TableCell>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap" dir="ltr">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.actorUsername ?? '—'}</span>
                          </div>
                          {log.entityId && (
                            <span className="block text-xs text-muted-foreground" dir="ltr">
                              {log.entityId}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={style.tone} className="gap-1.5 whitespace-nowrap">
                            <style.icon className="h-3 w-3" />
                            {tLabel(`audit.actions.${log.action}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {tLabel(`audit.entities.${log.entity}`)}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-xs">
                          {log.ip ?? '—'}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/40">
                            <div className="space-y-1 px-4 py-2">
                              <p className="text-xs font-semibold text-muted-foreground">
                                {t('audit.metadata')}
                              </p>
                              {metaEntries.length === 0 ? (
                                <p className="text-sm text-muted-foreground">—</p>
                              ) : (
                                <div className="flex flex-wrap gap-2" dir="ltr">
                                  {metaEntries.map(([key, value]) => (
                                    <span
                                      key={key}
                                      className="rounded-md border bg-background px-2 py-1 font-mono text-xs"
                                    >
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
