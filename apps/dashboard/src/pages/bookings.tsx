import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Phone, Plus } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PhoneInput } from '@/components/shared/phone-input'
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/shared/table-pagination'

type Booking = {
  id: string
  patientName: string
  phone: string
  source: 'website' | 'walk_in' | 'phone'
  departmentId: string | null
  departmentSlug: string | null
  departmentNameAr: string | null
  departmentNameEn: string | null
  preferredDate: string | null
  patientNotes: string | null
  status: 'new' | 'contacted' | 'confirmed' | 'declined' | 'cancelled' | 'completed'
  appointmentDate: string | null
  appointmentTime: string | null
  staffNotes: string | null
  createdAt: string
}

type ListResponse = { data: Booking[]; page: number; limit: number; total: number }

const STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'declined', 'cancelled'] as const


type ManualForm = {
  patientName: string
  phone: string
  source: 'walk_in' | 'phone'
  departmentId: string
  appointmentDate: string
  appointmentTime: string
  staffNotes: string
}

const emptyManual: ManualForm = {
  patientName: '',
  phone: '',
  source: 'walk_in',
  departmentId: '',
  appointmentDate: '',
  appointmentTime: '',
  staffNotes: '',
}

export function BookingsPage() {
  const { t, tLabel, dir } = useI18n()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [detail, setDetail] = useState<Booking | null>(null)
  const [detailNotes, setDetailNotes] = useState('')
  const [detailDate, setDetailDate] = useState('')
  const [detailTime, setDetailTime] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState<ManualForm>(emptyManual)
  const [error, setError] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['bookings', page, pageSize, statusFilter, sourceFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      return api<ListResponse>(`/bookings/admin/?${params}`)
    },
    placeholderData: keepPreviousData,
  })

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ data: Array<{ id: string; nameAr: string }> }>('/departments/admin/'),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['bookings'] })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<Booking>(`/bookings/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidate,
  })

  const detailMutation = useMutation({
    mutationFn: async () => {
      if (!detail) throw new Error('no booking')
      return api<Booking>(`/bookings/admin/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: detailDate || null,
          appointmentTime: detailTime || null,
          staffNotes: detailNotes || null,
        }),
      })
    },
    onSuccess: () => {
      invalidate()
      setDetail(null)
    },
  })

  const manualMutation = useMutation({
    mutationFn: () =>
      api<Booking>('/bookings/admin/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: manual.patientName.trim(),
          phone: manual.phone,
          source: manual.source,
          departmentId: manual.departmentId || undefined,
          appointmentDate: manual.appointmentDate || undefined,
          appointmentTime: manual.appointmentTime || undefined,
          staffNotes: manual.staffNotes || undefined,
        }),
      }),
    onSuccess: () => {
      invalidate()
      setManualOpen(false)
      setManual(emptyManual)
      setError(null)
    },
    onError: (e: Error) => setError(e.message),
  })

  function openDetail(b: Booking) {
    setDetail(b)
    setDetailNotes(b.staffNotes ?? '')
    setDetailDate(b.appointmentDate ?? '')
    setDetailTime(b.appointmentTime ?? '')
  }

  const statusBadge = (status: string) => {
    const variant =
      status === 'new' ? 'default' : status === 'confirmed' || status === 'completed' ? 'secondary' : 'outline'
    return <Badge variant={variant}>{tLabel(`bookings.status.${status}`)}</Badge>
  }

  const rows = listQuery.data?.data ?? []
  const departments = departmentsQuery.data?.data ?? []

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('bookings.title')}</h1>
        <Button onClick={() => setManualOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('bookings.manual')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={String(s)}>{tLabel(`bookings.status.${s}`)}</SelectItem>
            ))}
            <SelectItem value="all">{t('bookings.allStatuses')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(['website', 'walk_in', 'phone'] as const).map((s) => (
              <SelectItem key={s} value={s}>{tLabel(`bookings.source.${s}`)}</SelectItem>
            ))}
            <SelectItem value="all">{t('bookings.allSources')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>{t('submissions.name')}</TableHead>
              <TableHead>{t('submissions.phone')}</TableHead>
              <TableHead>{t('departments.title')}</TableHead>
              <TableHead>{t('submissions.status')}</TableHead>
              <TableHead>{t('bookings.appointment')}</TableHead>
              <TableHead>{t('bookings.source.label')}</TableHead>
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
                  {t('bookings.none')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((b) => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => openDetail(b)}>
                  <TableCell className="font-medium">{b.patientName}</TableCell>
                  <TableCell dir="ltr">{b.phone}</TableCell>
                  <TableCell dir="rtl">{b.departmentNameAr ?? '—'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={b.status}
                      onValueChange={(status) => statusMutation.mutate({ id: b.id, status: status ?? 'new' })}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{tLabel(`bookings.status.${s}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell dir="ltr" className="whitespace-nowrap text-muted-foreground">
                    {b.appointmentDate ? `${b.appointmentDate} ${b.appointmentTime ?? ''}` : '—'}
                  </TableCell>
                  <TableCell>{tLabel(`bookings.source.${b.source}`)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground" dir="ltr">
                    {new Date(b.createdAt).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-GB')}
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
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />

      {/* Detail / manage dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.patientName}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <a href={`tel:${detail.phone}`} className="flex items-center gap-1.5 hover:text-foreground" dir="ltr">
                  <Phone className="h-4 w-4" /> {detail.phone}
                </a>
                {statusBadge(detail.status)}
                {detail.preferredDate && (
                  <span>{t('bookings.preferred')}: {detail.preferredDate}</span>
                )}
              </div>
              {detail.patientNotes && (
                <p className="rounded-lg border bg-muted/50 p-3 text-sm leading-relaxed">{detail.patientNotes}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('bookings.appointmentDate')}</Label>
                  <Input type="date" dir="ltr" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('bookings.appointmentTime')}</Label>
                  <Input type="time" dir="ltr" value={detailTime} onChange={(e) => setDetailTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('bookings.staffNotes')}</Label>
                <Textarea rows={3} value={detailNotes} onChange={(e) => setDetailNotes(e.target.value)} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>{t('common.cancel')}</Button>
                <Button onClick={() => detailMutation.mutate()} disabled={detailMutation.isPending}>
                  {detailMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual entry dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('bookings.manual')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e: FormEvent) => { e.preventDefault(); setError(null); manualMutation.mutate() }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>{t('submissions.name')}</Label>
              <Input required value={manual.patientName} onChange={(e) => setManual((m) => ({ ...m, patientName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('submissions.phone')}</Label>
              <PhoneInput value={manual.phone} onChange={(v) => setManual((m) => ({ ...m, phone: v }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('bookings.source.label')}</Label>
                <Select value={manual.source} onValueChange={(v) => setManual((m) => ({ ...m, source: (v ?? 'walk_in') as 'walk_in' | 'phone' }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">{tLabel('bookings.source.walk_in')}</SelectItem>
                    <SelectItem value="phone">{tLabel('bookings.source.phone')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('departments.title')}</Label>
                <Select value={manual.departmentId || 'none'} onValueChange={(v) => setManual((m) => ({ ...m, departmentId: v === 'none' ? '' : (v ?? '') }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} dir="rtl">{d.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('bookings.appointmentDate')}</Label>
                <Input type="date" dir="ltr" value={manual.appointmentDate} onChange={(e) => setManual((m) => ({ ...m, appointmentDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('bookings.appointmentTime')}</Label>
                <Input type="time" dir="ltr" value={manual.appointmentTime} onChange={(e) => setManual((m) => ({ ...m, appointmentTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('bookings.staffNotes')}</Label>
              <Textarea rows={2} value={manual.staffNotes} onChange={(e) => setManual((m) => ({ ...m, staffNotes: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={manualMutation.isPending}>
                {manualMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
