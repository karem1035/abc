import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, CalendarDays, Clock, Eye, Loader2, Pencil, UserRound,
} from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { slugify } from '@/lib/slugify'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
  contentAr?: string | null
  contentEn?: string | null
  photoUrl: string | null
  departmentId: string | null
  departmentName?: string | null
  sortOrder: number
  status: 'draft' | 'published' | 'archived'
}

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
  slug: '', nameAr: '', nameEn: '', titleAr: '', titleEn: '',
  contentAr: '', contentEn: '', photoUrl: '', departmentId: '',
  sortOrder: '0', status: 'published', schedule: [],
}

const WEEKDAYS = [...Array(7).keys()]
const STATUSES = ['published', 'draft', 'archived'] as const

/** expand schedule rules into slot chips for the preview */
function previewSlots(rules: ScheduleRule[], weekday: number): string[] {
  const toMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5))
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const slots: string[] = []
  for (const r of rules.filter((r) => r.weekday === weekday)) {
    const step = Math.max(5, Number(r.slotMinutes) || 30)
    for (let t = toMin(r.startTime); t + step <= toMin(r.endTime); t += step) slots.push(fmt(t))
  }
  return [...new Set(slots)].sort()
}

export function DoctorEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { t, tLabel, dir } = useI18n()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<DoctorForm>(emptyForm)
  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [error, setError] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null | undefined>(null)

  const doctorQuery = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api<{ data: Doctor[] }>('/departments/admin/doctors'),
    enabled: !isNew,
  })

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ data: Array<{ id: string; nameAr: string }> }>('/departments/admin/'),
  })

  // load doctor + schedule into the form once
  useEffect(() => {
    if (isNew || !doctorQuery.data || loadedId === id) return
    const doc = doctorQuery.data.data.find((d) => d.id === id)
    if (!doc) return
    setForm({
      slug: doc.slug,
      nameAr: doc.nameAr,
      nameEn: doc.nameEn,
      titleAr: doc.titleAr ?? '',
      titleEn: doc.titleEn ?? '',
      contentAr: doc.contentAr ?? '',
      contentEn: doc.contentEn ?? '',
      photoUrl: doc.photoUrl ?? '',
      departmentId: doc.departmentId ?? '',
      sortOrder: String(doc.sortOrder),
      status: doc.status,
      schedule: [],
    })
    setLoadedId(id)
    void api<{ data: Array<{ weekday: number; startTime: string; endTime: string; slotMinutes: number }> }>(
      `/departments/admin/doctors/${id}/schedule`,
    )
      .then((res) => {
        setForm((f) => ({
          ...f,
          schedule: res.data.map((r) => ({
            weekday: r.weekday, startTime: r.startTime, endTime: r.endTime, slotMinutes: String(r.slotMinutes),
          })),
        }))
      })
      .catch(() => {})
  }, [doctorQuery.data, id, isNew, loadedId])

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
      const saved = await (isNew
        ? api<{ id: string }>('/departments/admin/doctors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : api<{ id: string }>(`/departments/admin/doctors/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }))
      await api(`/departments/admin/doctors/${saved.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: form.schedule.map((r) => ({
            weekday: Number(r.weekday), startTime: r.startTime, endTime: r.endTime,
            slotMinutes: Number(r.slotMinutes) || 30,
          })),
        }),
      })
      return saved
    },
    onSuccess: (saved) => {
      toast.success(t('toast.saved'))
      void queryClient.invalidateQueries({ queryKey: ['doctors'] })
      void queryClient.invalidateQueries({ queryKey: ['doctor', id] })
      if (isNew) navigate(`/doctors/${saved.id}`, { replace: true })
      else setLoadedId(undefined) // allow reload
    },
    onError: (e: Error) => { setError(e.message); toast.error(e.message) },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft
  const departments = departmentsQuery.data?.data ?? []
  const departmentName = departments.find((d) => d.id === form.departmentId)?.nameAr ?? null
  const ar = tab === 'ar'
  const previewName = ar ? form.nameAr : form.nameEn
  const previewTitle = ar ? form.titleAr : form.titleEn
  const previewBio = ar ? form.contentAr : form.contentEn
  const firstWorkday = form.schedule.length > 0 ? form.schedule.map((s) => s.weekday).sort()[0] : null

  if (!isNew && doctorQuery.isLoading) {
    return (
      <div className="space-y-4 p-3 lg:p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3 lg:p-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/doctors')} aria-label={t('doctors.title')}>
          <BackIcon className="h-4 w-4" />
        </Button>
        <h1 className="flex-1 font-serif text-xl font-bold sm:text-2xl">
          {isNew ? t('doctors.add') : `${t('doctors.edit')} — ${form.nameAr || form.nameEn}`}
        </h1>
        {/* edit / preview toggle */}
        <div className="flex rounded-md border p-0.5">
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors',
                mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {m === 'edit' ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {m === 'edit' ? t('doctors.mode.edit') : t('doctors.mode.preview')}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('grid gap-6', mode === 'edit' ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        {/* ---------------- EDIT ---------------- */}
        {mode === 'edit' && (
          <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug <span className="text-muted-foreground">(URL)</span></Label>
                <Input dir="ltr" pattern="[a-z0-9-]+" placeholder="ahmed-mohamed"
                  value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                <p className="text-xs text-muted-foreground">{t('postCategories.slugAuto')}</p>
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
                      <SelectItem key={s} value={s}>
                        {s === 'published' ? t('departments.published') : s === 'draft' ? t('departments.draft') : t('departments.archived')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('doctors.nameAr')}</Label>
                <Input dir="rtl" required value={form.nameAr}
                  onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value, slug: slugify(f.nameEn || e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('doctors.nameEn')}</Label>
                <Input dir="ltr" required value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value, slug: slugify(e.target.value || f.nameAr) }))} />
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
              <div className="space-y-2">
                <Label>{t('departments.title')}</Label>
                <Select value={form.departmentId || 'none'}
                  onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v === 'none' ? '' : (v ?? '') }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
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
                <ImageInput aspect="square" value={form.photoUrl}
                  onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))} />
              </div>
            </div>

            {/* bio tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('doctors.bio')}</Label>
                <div className="flex rounded-md border p-0.5">
                  {(['ar', 'en'] as const).map((lng) => (
                    <button key={lng} type="button" onClick={() => setTab(lng)}
                      className={cn('rounded px-3 py-1 text-xs font-bold transition-colors',
                        tab === lng ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                      {lng === 'ar' ? 'العربية' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
              <RichTextEditor
                dir={ar ? 'rtl' : 'ltr'}
                placeholder={ar ? t('departments.contentAr') : t('departments.contentEn')}
                value={ar ? form.contentAr : form.contentEn}
                onChange={(html) => setForm((f) => (ar ? { ...f, contentAr: html } : { ...f, contentEn: html }))}
              />
            </div>

            {/* schedule */}
            <ScheduleEditor form={form} setForm={setForm} t={t} tLabel={tLabel} />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode('preview')}>
                <Eye className="h-4 w-4" />
                {t('doctors.mode.preview')}
              </Button>
            </div>
          </form>
        )}

        {/* ---------------- PREVIEW (public page mock) ---------------- */}
        <div className={cn('space-y-5', mode === 'edit' && 'lg:sticky lg:top-4 lg:self-start')}>
          <div className="overflow-hidden rounded-lg border">
            {/* header band */}
            <div className="flex items-center gap-4 border-b bg-muted/50 p-4">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="" className="size-20 rounded-full border-2 border-primary/20 object-cover" />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-muted">
                  <UserRound className="size-8 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{previewName || (ar ? 'اسم الطبيب' : 'Doctor name')}</p>
                {previewTitle && <p className="truncate text-sm text-muted-foreground">{previewTitle}</p>}
                {departmentName && <Badge variant="outline" className="mt-1.5">{departmentName}</Badge>}
              </div>
            </div>

            {/* bio */}
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t('doctors.bio')}</p>
              {previewBio ? (
                <div className="prose-tiptap rounded-md border bg-card p-3 text-sm" dir={ar ? 'rtl' : 'ltr'}
                  dangerouslySetInnerHTML={{ __html: previewBio }} />
              ) : (
                <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {ar ? 'لا يوجد محتوى بعد' : 'No content yet'}
                </p>
              )}
            </div>

            {/* schedule + slots */}
            <div className="border-t p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {t('doctors.schedule')}
              </p>
              {form.schedule.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  {t('doctors.noSessions')}
                </p>
              ) : (
                <div className="space-y-3">
                  {[...form.schedule]
                    .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
                    .map((rule, i) => (
                      <div key={i} className="rounded-md border p-2.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold">{tLabel(`days.${rule.weekday}`)}</span>
                          <span className="text-muted-foreground" dir="ltr">{rule.startTime} — {rule.endTime}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {previewSlots(form.schedule, rule.weekday).map((s) => (
                            <span key={s} className="flex items-center gap-1 rounded border bg-muted/60 px-2 py-1 text-xs" dir="ltr">
                              <Clock className="size-3 text-muted-foreground" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {firstWorkday !== null && previewSlots(form.schedule, firstWorkday).length === 0 && form.schedule.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">—</p>
              )}
            </div>

            {/* public link */}
            {!isNew && form.status === 'published' && (
              <div className="border-t bg-muted/30 px-4 py-2.5 text-center">
                <Link
                  to={`/ar/doctors/${form.slug}`}
                  target="_blank"
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  dir="ltr"
                >
                  /ar/doctors/{form.slug}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleEditor({
  form, setForm, t, tLabel,
}: {
  form: DoctorForm
  setForm: React.Dispatch<React.SetStateAction<DoctorForm>>
  t: ReturnType<typeof useI18n>['t']
  tLabel: ReturnType<typeof useI18n>['tLabel']
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('doctors.schedule')}</Label>
        <Button type="button" variant="outline" size="sm"
          onClick={() => setForm((f) => ({
            ...f,
            schedule: [...f.schedule, { weekday: 0, startTime: '10:00', endTime: '14:00', slotMinutes: '30' }],
          }))}>
          {t('doctors.addSession')}
        </Button>
      </div>
      {form.schedule.length === 0 && (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">{t('doctors.noSessions')}</p>
      )}
      <div className="space-y-2">
        {form.schedule.map((rule, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <Select value={String(rule.weekday)}
              onValueChange={(v) => setForm((f) => {
                const schedule = [...f.schedule]
                schedule[i] = { ...rule, weekday: Number(v ?? 0) }
                return { ...f, schedule }
              })}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{tLabel(`days.${d}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="time" dir="ltr" className="h-8 w-28" value={rule.startTime}
              onChange={(e) => setForm((f) => {
                const schedule = [...f.schedule]
                schedule[i] = { ...rule, startTime: e.target.value }
                return { ...f, schedule }
              })} />
            <span className="text-xs text-muted-foreground">→</span>
            <Input type="time" dir="ltr" className="h-8 w-28" value={rule.endTime}
              onChange={(e) => setForm((f) => {
                const schedule = [...f.schedule]
                schedule[i] = { ...rule, endTime: e.target.value }
                return { ...f, schedule }
              })} />
            <Input type="number" min={5} className="h-8 w-24" title={t('doctors.slotMinutes')}
              value={rule.slotMinutes}
              onChange={(e) => setForm((f) => {
                const schedule = [...f.schedule]
                schedule[i] = { ...rule, slotMinutes: e.target.value }
                return { ...f, schedule }
              })} />
            <span className="text-xs text-muted-foreground">{t('doctors.slotMinutes')}</span>
            <Button type="button" variant="ghost" size="icon" className="ms-auto h-8 w-8"
              onClick={() => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, j) => j !== i) }))}
              aria-label={t('common.delete')}>
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
