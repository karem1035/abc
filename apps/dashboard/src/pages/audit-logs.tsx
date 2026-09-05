import { Fragment, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { DateRange } from 'react-day-picker'
import {
  ChevronDown,
  Download,
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_PAGE_SIZE,
  TablePagination,
} from '@/components/shared/table-pagination'
import { DateRangePicker } from '@/components/shared/date-range-picker'
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

/** Every action the system writes today — used for the type filter. */
const ACTION_TYPES = [
  'auth.login',
  'auth.logout',
  'user.created',
  'user.updated',
  'user.deleted',
  'profile.updated',
  'profile.password_changed',
  'media.uploaded',
  'media.deleted',
] as const

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

function buildQuery(page: number, limit: number, action: string, range: DateRange | undefined) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (action && action !== 'all') params.set('action', action)
  if (range?.from) params.set('from', new Date(range.from.setHours(0, 0, 0, 0)).toISOString())
  if (range?.to) params.set('to', new Date(range.to.setHours(23, 59, 59, 999)).toISOString())
  return params.toString()
}

function toCsv(rows: AuditLog[], tLabel: (key: string) => string): string {
  const header = ['date', 'actor', 'action', 'entity', 'ip', 'metadata']
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
  const lines = rows.map((row) =>
    [
      formatDateTime(row.createdAt),
      row.actorUsername ?? '',
      tLabel(`audit.actions.${row.action}`),
      tLabel(`audit.entities.${row.entity}`),
      row.ip ?? '',
      JSON.stringify(row.metadata ?? {}),
    ]
      .map(escape)
      .join(','),
  )
  return [header.join(','), ...lines].join('\n')
}

export function AuditLogsPage() {
  const { t, tLabel } = useI18n()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [action, setAction] = useState<string>('all')
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const query = buildQuery(page, pageSize, action, range)

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () => api<AuditLogsResponse>(`/audit-logs?${query}`),
    placeholderData: keepPreviousData,
  })

  const hasFilters = action !== 'all' || Boolean(range?.from)

  async function exportCsv() {
    setExporting(true)
    try {
      // Fetch every page of the current filter (capped at 1000 rows)
      const all: AuditLog[] = []
      let p = 1
      while (all.length < 1000) {
        const res = await api<AuditLogsResponse>(`/audit-logs?${buildQuery(p, 100, action, range)}`)
        all.push(...res.data)
        if (all.length >= res.total || res.data.length === 0) break
        p += 1
      }
      const csv = toCsv(all, tLabel)
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{t('audit.title')}</h1>
        <Button variant="outline" onClick={exportCsv} disabled={exporting || isLoading}>
          <Download className="h-4 w-4" />
          {t('audit.exportCsv')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={action}
          onValueChange={(v) => {
            setAction(String(v))
            setPage(1)
          }}
        >
          <SelectTrigger size="sm" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('audit.allActions')}</SelectItem>
            {ACTION_TYPES.map((a) => (
              <SelectItem key={a} value={a} label={tLabel(`audit.actions.${a}`)}>
                {tLabel(`audit.actions.${a}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          range={range}
          onChange={(next) => {
            setRange(next)
            setPage(1)
          }}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAction('all')
              setRange(undefined)
              setPage(1)
            }}
          >
            {t('audit.clear')}
          </Button>
        )}
      </div>

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
                        {/* The date keeps its column; only the text reads LTR */}
                        <TableCell className="whitespace-nowrap">
                          <span dir="ltr">{formatDateTime(log.createdAt)}</span>
                        </TableCell>
                        <TableCell>{log.actorUsername ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={style.tone} className="gap-1.5 whitespace-nowrap">
                            <style.icon className="h-3 w-3" />
                            {tLabel(`audit.actions.${log.action}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {tLabel(`audit.entities.${log.entity}`)}
                        </TableCell>
                        <TableCell>
                          <span dir="ltr" className="font-mono text-xs">
                            {log.ip ?? '—'}
                          </span>
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
                                <div className="flex flex-wrap gap-2">
                                  {metaEntries.map(([key, value]) => (
                                    <span
                                      key={key}
                                      dir="ltr"
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
