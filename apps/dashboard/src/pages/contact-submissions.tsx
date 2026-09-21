import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MessageSquare, Phone } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { formatDateTime } from '@/lib/format'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/shared/table-pagination'

type Submission = {
  id: string
  name: string
  phone: string
  email: string | null
  type: string | null
  otherType: string | null
  message: string
  status: 'new' | 'read' | 'archived'
  createdAt: string
}

type SubmissionsResponse = {
  data: Submission[]
  page: number
  limit: number
  total: number
}

const STATUSES = ['new', 'read', 'archived'] as const

export function ContactSubmissionsPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [viewing, setViewing] = useState<Submission | null>(null)

  const listQuery = useQuery({
    queryKey: ['contact-submissions', page, pageSize],
    queryFn: () => api<SubmissionsResponse>(`/contact/admin/submissions?page=${page}&limit=${pageSize}`),
    placeholderData: keepPreviousData,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<Submission>(`/contact/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['contact-submissions'] }),
  })

  const statusLabel: Record<string, string> = {
    new: t('submissions.new'),
    read: t('submissions.read'),
    archived: t('submissions.archived'),
  }

  function typeLabel(s: Submission) {
    if (s.type === 'other') return s.otherType || t('submissions.type')
    return s.type ?? '—'
  }

  const rows = listQuery.data?.data ?? []

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('submissions.title')}</h1>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>{t('submissions.name')}</TableHead>
              <TableHead>{t('submissions.phone')}</TableHead>
              <TableHead>{t('submissions.email')}</TableHead>
              <TableHead>{t('submissions.type')}</TableHead>
              <TableHead>{t('submissions.message')}</TableHead>
              <TableHead>{t('submissions.status')}</TableHead>
              <TableHead>{t('common.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {t('submissions.none')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setViewing(s)}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell dir="ltr">{s.phone}</TableCell>
                  <TableCell dir="ltr" className="max-w-44 truncate">{s.email ?? '—'}</TableCell>
                  <TableCell>{typeLabel(s)}</TableCell>
                  <TableCell className="max-w-52 truncate">{s.message}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={s.status}
                      onValueChange={(status) => statusMutation.mutate({ id: s.id, status: status ?? 'new' })}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue>{statusLabel[s.status]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>{statusLabel[st]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground" dir="ltr">
                    {formatDateTime(s.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={listQuery.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />

      {/* Full message dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5" dir="ltr">
                  <Phone className="h-4 w-4" /> {viewing.phone}
                </span>
                {viewing.email && (
                  <span className="flex items-center gap-1.5" dir="ltr">
                    <Mail className="h-4 w-4" /> {viewing.email}
                  </span>
                )}
                <Badge variant="outline">{typeLabel(viewing)}</Badge>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed">
                <MessageSquare className="mb-2 h-4 w-4 text-muted-foreground" />
                {viewing.message}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
