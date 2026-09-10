import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ImageInput } from '@/components/shared/image-input'
import { RichTextEditor } from '@/components/shared/richtext-editor'

type Doctor = {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  titleAr: string | null
  titleEn: string | null
  photoUrl: string | null
  departmentId: string | null
  departmentName?: string | null
  sortOrder: number
  status: 'draft' | 'published' | 'archived'
}

const STATUSES = ['published', 'draft', 'archived'] as const

type ScheduleRule = {
  weekday: number
  startTime: string
  endTime: string
  slotMinutes: string
}

type DoctorForm = {
  slug: string
  nameAr: string
  nameEn: string
  titleAr: string
  titleEn: string
  contentAr: string
  contentEn: string
  photoUrl: string
  departmentId: string
  sortOrder: string
  status: string
  schedule: ScheduleRule[]
}

const emptyForm: DoctorForm = {
  slug: '',
  nameAr: '',
  nameEn: '',
  titleAr: '',
  titleEn: '',
  contentAr: '',
  contentEn: '',
  photoUrl: '',
  departmentId: '',
  sortOrder: '0',
  status: 'published',
  schedule: [],
}

const WEEKDAYS = [...Array(7).keys()]

export function DoctorsPage() {
  const { t, tLabel, dir } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [deleting, setDeleting] = useState<Doctor | null>(null)
  const [form, setForm] = useState<DoctorForm>(emptyForm)
  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [error, setError] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api<{ data: Doctor[] }>('/departments/admin/doctors'),
    placeholderData: keepPreviousData,
  })

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ data: Array<{ id: string; nameAr: string }> }>('/departments/admin/'),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        titleAr: form.titleAr || undefined,
        titleEn: form.titleEn || undefined,
        contentAr: form.contentAr || undefined,
        contentEn: form.contentEn || undefined,
        photoUrl: form.photoUrl || undefined,
        departmentId: form.departmentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      }
      const saved = await (editing
        ? api<Doctor>(`/departments/admin/doctors/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : api<Doctor>('/departments/admin/doctors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }) as Promise<{ id: string }>)
      // replace the weekly schedule
      await api(`/departments/admin/doctors/${saved.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: form.schedule.map((r) => ({
            weekday: Number(r.weekday),
            startTime: r.startTime,
            endTime: r.endTime,
            slotMinutes: Number(r.slotMinutes) || 30,
          })),
        }),
      })
      return saved
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctors'] })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDialogOpen(false)
    },
    onError: (e: Error) => setError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/departments/admin/doctors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctors'] })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDeleting(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(doc: Doctor) {
    setEditing(doc)
    setForm({
      slug: doc.slug,
      nameAr: doc.nameAr,
      nameEn: doc.nameEn,
      titleAr: doc.titleAr ?? '',
      titleEn: doc.titleEn ?? '',
      contentAr: (doc as Doctor & { contentAr?: string | null }).contentAr ?? '',
      contentEn: (doc as Doctor & { contentEn?: string | null }).contentEn ?? '',
      photoUrl: doc.photoUrl ?? '',
      departmentId: doc.departmentId ?? '',
      sortOrder: String(doc.sortOrder),
      status: doc.status,
      schedule: [],
    })
    setTab('ar')
    setError(null)
    setDialogOpen(true)
    // fetch the weekly schedule rules
    void api<{ data: Array<{ weekday: number; startTime: string; endTime: string; slotMinutes: number }> }>(
      `/departments/admin/doctors/${doc.id}/schedule`,
    ).then((res) => {
      setForm((f) => ({
        ...f,
        schedule: res.data.map((r) => ({
          weekday: r.weekday,
          startTime: r.startTime,
          endTime: r.endTime,
          slotMinutes: String(r.slotMinutes),
        })),
      }))
    }).catch(() => {})
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const rows = listQuery.data?.data ?? []
  const departments = departmentsQuery.data?.data ?? []
  const statusLabel: Record<string, string> = {
    published: t('departments.published'),
    draft: t('departments.draft'),
    archived: t('departments.archived'),
  }

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('doctors.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('doctors.add')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>{t('doctors.nameAr')}</TableHead>
              <TableHead>{t('doctors.nameEn')}</TableHead>
              <TableHead>{t('doctors.titleAr')}</TableHead>
              <TableHead>{t('departments.title')}</TableHead>
              <TableHead>{t('departments.status')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t('doctors.none')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium" dir="rtl">{doc.nameAr}</TableCell>
                  <TableCell dir="ltr">{doc.nameEn}</TableCell>
                  <TableCell className="max-w-48 truncate" dir="rtl">{doc.titleAr ?? '—'}</TableCell>
                  <TableCell dir="rtl">{doc.departmentName ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'published' ? 'default' : 'secondary'}>
                      {statusLabel[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                        <Ellipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => openEdit(doc)}>
                          <Pencil className="h-4 w-4" />
                          {t('doctors.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(doc)}>
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? t('doctors.edit') : t('doctors.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug <span className="text-muted-foreground">(URL)</span></Label>
                <Input dir="ltr" required pattern="[a-z0-9-]+" placeholder="ahmed-mohamed"
                  value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.sortOrder')}</Label>
                <Input type="number" value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('departments.status')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v ?? 'published' }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('doctors.nameAr')}</Label>
                <Input dir="rtl" required value={form.nameAr}
                  onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('doctors.nameEn')}</Label>
                <Input dir="ltr" required value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('doctors.titleAr')}</Label>
                <Input dir="rtl" value={form.titleAr}
                  onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('doctors.titleEn')}</Label>
                <Input dir="ltr" value={form.titleEn}
                  onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('departments.title')}</Label>
                <Select
                  value={form.departmentId || 'none'}
                  onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v === 'none' ? '' : (v ?? '') }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} dir="rtl">{d.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('doctors.photo')}</Label>
                <ImageInput
                  aspect="square"
                  value={form.photoUrl}
                  onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
                />
              </div>
            </div>

            {/* Bio content with AR/EN tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('doctors.bio')}</Label>
                <div className="flex rounded-md border p-0.5">
                  {(['ar', 'en'] as const).map((lng) => (
                    <button
                      key={lng}
                      type="button"
                      onClick={() => setTab(lng)}
                      className={`rounded px-3 py-1 text-xs font-bold transition-colors ${tab === lng ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      {lng === 'ar' ? 'العربية' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
              {tab === 'ar' ? (
                <RichTextEditor
                  dir="rtl"
                  placeholder={t('departments.contentAr')}
                  value={form.contentAr}
                  onChange={(html) => setForm((f) => ({ ...f, contentAr: html }))}
                />
              ) : (
                <RichTextEditor
                  dir="ltr"
                  placeholder={t('departments.contentEn')}
                  value={form.contentEn}
                  onChange={(html) => setForm((f) => ({ ...f, contentEn: html }))}
                />
              )}
            </div>

            {/* Weekly schedule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('doctors.schedule')}</Label>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      schedule: [...f.schedule, { weekday: 0, startTime: '10:00', endTime: '14:00', slotMinutes: '30' }],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('doctors.addSession')}
                </Button>
              </div>
              {form.schedule.length === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  {t('doctors.noSessions')}
                </p>
              )}
              <div className="space-y-2">
                {form.schedule.map((rule, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                    <Select
                      value={String(rule.weekday)}
                      onValueChange={(v) =>
                        setForm((f) => {
                          const schedule = [...f.schedule]
                          schedule[i] = { ...rule, weekday: Number(v ?? 0) }
                          return { ...f, schedule }
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d} value={String(d)}>{tLabel(`days.${d}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time" dir="ltr" className="h-8 w-28"
                      value={rule.startTime}
                      onChange={(e) =>
                        setForm((f) => {
                          const schedule = [...f.schedule]
                          schedule[i] = { ...rule, startTime: e.target.value }
                          return { ...f, schedule }
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <Input
                      type="time" dir="ltr" className="h-8 w-28"
                      value={rule.endTime}
                      onChange={(e) =>
                        setForm((f) => {
                          const schedule = [...f.schedule]
                          schedule[i] = { ...rule, endTime: e.target.value }
                          return { ...f, schedule }
                        })
                      }
                    />
                    <Input
                      type="number" min={5} className="h-8 w-24"
                      title={t('doctors.slotMinutes')}
                      value={rule.slotMinutes}
                      onChange={(e) =>
                        setForm((f) => {
                          const schedule = [...f.schedule]
                          schedule[i] = { ...rule, slotMinutes: e.target.value }
                          return { ...f, schedule }
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">{t('doctors.slotMinutes')}</span>
                    <Button
                      type="button" variant="ghost" size="icon" className="ms-auto h-8 w-8"
                      onClick={() => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, j) => j !== i) }))}
                      aria-label={t('common.delete')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('doctors.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription dir="rtl">{deleting?.nameAr}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && deleteMutation.mutate(deleting.id)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
