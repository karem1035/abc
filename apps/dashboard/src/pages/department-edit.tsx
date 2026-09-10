import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/shared/richtext-editor'
import { ImageInput } from '@/components/shared/image-input'

type Department = {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  descriptionAr: string | null
  descriptionEn: string | null
  contentAr: string | null
  contentEn: string | null
  imageUrl: string | null
  sortOrder: number
  status: 'draft' | 'published' | 'archived'
  doctorsCount?: number
}

const STATUSES = ['published', 'draft', 'archived'] as const

type DeptForm = {
  slug: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  contentAr: string
  contentEn: string
  imageUrl: string
  sortOrder: string
  status: string
}

const emptyForm: DeptForm = {
  slug: '',
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  contentAr: '',
  contentEn: '',
  imageUrl: '',
  sortOrder: '0',
  status: 'published',
}

export function DepartmentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, dir } = useI18n()
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ data: Department[] }>('/departments/admin/'),
    enabled: Boolean(id),
  })
  if (id && query.isPending) return <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin" aria-label={dir === 'rtl' ? 'جارٍ التحميل' : 'Loading'} /></div>
  if (id && query.isError) return <div className="space-y-4 p-6"><p role="alert">{query.error.message}</p><Button onClick={() => void query.refetch()}>{dir === 'rtl' ? 'إعادة المحاولة' : 'Try again'}</Button></div>
  const department = id ? query.data?.data.find((item) => item.id === id) : null
  if (id && !department) return <div className="space-y-4 p-6"><p>{dir === 'rtl' ? 'القسم غير موجود' : 'Department not found'}</p><Button onClick={() => navigate('/departments')}>{t('departments.title')}</Button></div>
  return <DepartmentEditor key={id ?? 'new'} editing={department ?? null} />
}

function DepartmentEditor({ editing }: { editing: Department | null }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<DeptForm>(() => editing ? {
    slug: editing.slug, nameAr: editing.nameAr, nameEn: editing.nameEn,
    descriptionAr: editing.descriptionAr ?? '', descriptionEn: editing.descriptionEn ?? '',
    contentAr: editing.contentAr ?? '', contentEn: editing.contentEn ?? '',
    imageUrl: editing.imageUrl ?? '', sortOrder: String(editing.sortOrder), status: editing.status,
  } : { ...emptyForm })
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        descriptionAr: form.descriptionAr,
        descriptionEn: form.descriptionEn,
        contentAr: form.contentAr,
        contentEn: form.contentEn,
        imageUrl: form.imageUrl,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      }
      return editing
        ? api<Department>(`/departments/admin/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : api<Department>('/departments/admin/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      navigate('/departments')
    },
    onError: (e: Error) => setError(e.message),
  })


  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (saveMutation.isPending) return
    setError(null)
    saveMutation.mutate()
  }
  const statusLabel: Record<string, string> = {
    published: t('departments.published'), draft: t('departments.draft'), archived: t('departments.archived'),
  }
  return <div className="mx-auto w-full max-w-6xl space-y-5 p-3 lg:p-6">
    <div className="flex items-center gap-3"><Button variant="outline" size="icon" disabled={saveMutation.isPending} onClick={() => navigate('/departments')} aria-label={t('departments.title')}><ArrowLeft className="size-4 rtl:rotate-180" /></Button><div><p className="text-sm text-muted-foreground">{t('departments.title')}</p><h1 className="text-2xl font-bold">{editing ? t('departments.edit') : t('departments.add')}</h1></div></div>
          <form onSubmit={onSubmit} className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug <span className="text-muted-foreground">(URL)</span></Label>
                <Input
                  dir="ltr" required
                  pattern="[a-z0-9-]+"
                  placeholder="cardiology"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.sortOrder')}</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
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
                <Label>{t('departments.nameAr')}</Label>
                <Input dir="rtl" required value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('departments.nameEn')}</Label>
                <Input dir="ltr" required value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('departments.descriptionAr')}</Label>
                <Textarea dir="rtl" rows={2} value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('departments.descriptionEn')}</Label>
                <Textarea dir="ltr" rows={2} value={form.descriptionEn} onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} />
              </div>
            </div>

            {/* Rich content with AR/EN tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('departments.content')}</Label>
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
                  key="ar"
                  dir="rtl"
                  placeholder={t('departments.contentAr')}
                  value={form.contentAr}
                  onChange={(html) => setForm((f) => ({ ...f, contentAr: html }))}
                />
              ) : (
                <RichTextEditor
                  key="en"
                  dir="ltr"
                  placeholder={t('departments.contentEn')}
                  value={form.contentEn}
                  onChange={(html) => setForm((f) => ({ ...f, contentEn: html }))}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('departments.image')}</Label>
              <ImageInput
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-card py-4">
              <Button type="button" variant="outline" onClick={() => navigate('/departments')} disabled={saveMutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </form>
  </div>
}
