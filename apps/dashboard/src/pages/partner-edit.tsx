import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, Loader2, Pencil } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
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

type Partner = {
  id: string
  nameAr: string
  nameEn: string
  contentAr: string | null
  contentEn: string | null
  category: 'insurance' | 'company' | 'authority'
  logoUrl: string | null
  websiteUrl: string | null
  sortOrder: number
  isActive: boolean
}

const CATEGORIES = ['insurance', 'company', 'authority'] as const

export function PartnerEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', contentAr: '', contentEn: '',
    category: 'insurance', logoUrl: '', websiteUrl: '', sortOrder: '0', isActive: true,
  })
  const [loadedId, setLoadedId] = useState<string | null | undefined>(null)

  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => api<{ data: Partner[] }>('/content/admin/partners'),
  })

  useEffect(() => {
    if (isNew || !partnersQuery.data || loadedId === id) return
    const partner = partnersQuery.data.data.find((p) => p.id === id)
    if (!partner) return
    setForm({
      nameAr: partner.nameAr,
      nameEn: partner.nameEn,
      contentAr: partner.contentAr ?? '',
      contentEn: partner.contentEn ?? '',
      category: partner.category,
      logoUrl: partner.logoUrl ?? '',
      websiteUrl: partner.websiteUrl ?? '',
      sortOrder: String(partner.sortOrder),
      isActive: partner.isActive,
    })
    setLoadedId(id)
  }, [partnersQuery.data, id, isNew, loadedId])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        contentAr: form.contentAr || undefined,
        contentEn: form.contentEn || undefined,
        category: form.category,
        logoUrl: form.logoUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      return isNew
        ? api<{ id: string }>('/content/admin/partners', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
        : api<{ id: string }>(`/content/admin/partners/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
    },
    onSuccess: (saved) => {
      toast.success(t('toast.saved'))
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      if (isNew) navigate(`/partners/${saved.id}`, { replace: true })
      else setLoadedId(undefined)
    },
    onError: (e: Error) => { setError(e.message); toast.error(e.message) },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft
  const ar = tab === 'ar'
  const categoryLabel: Record<string, string> = {
    insurance: t('partners.category.insurance'),
    company: t('partners.category.company'),
    authority: t('partners.category.authority'),
  }
  const previewName = ar ? form.nameAr : form.nameEn
  const previewContent = ar ? form.contentAr : form.contentEn
  const others = (partnersQuery.data?.data ?? []).filter((p) => p.id !== id)

  if (!isNew && partnersQuery.isLoading) {
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/partners')} aria-label={t('partners.title')}>
          <BackIcon className="h-4 w-4" />
        </Button>
        <h1 className="flex-1 font-serif text-xl font-bold sm:text-2xl">
          {isNew ? t('partners.add') : `${t('partners.edit')} — ${form.nameAr || form.nameEn}`}
        </h1>
        <div className="flex rounded-md border p-0.5">
          {(['edit', 'preview'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn('flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors',
                mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('partners.nameAr')}</Label>
                <Input dir="rtl" required value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('partners.nameEn')}</Label>
                <Input dir="ltr" required value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('partners.category.label')}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? 'insurance' }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{categoryLabel[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.sortOrder')}</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('partners.website')}</Label>
                <Input dir="ltr" type="url" placeholder="https://…" value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('partners.logo')}</Label>
                <ImageInput value={form.logoUrl} onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))} />
              </div>
            </div>

            {/* content tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('departments.content')}</Label>
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

            <div className="flex items-center gap-2">
              <input id="partner-active" type="checkbox" className="size-4 accent-primary"
                checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              <Label htmlFor="partner-active">{t('faqs.active')}</Label>
            </div>

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

        {/* ---------------- PREVIEW ---------------- */}
        <div className={cn('space-y-5', mode === 'edit' && 'lg:sticky lg:top-4 lg:self-start')}>
          {/* partner card mock */}
          <div className="overflow-hidden rounded-lg border">
            <div className="flex flex-col items-center gap-3 border-b bg-muted/50 p-6">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="" className="max-h-16 w-auto object-contain" />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-full bg-muted font-serif text-2xl font-bold text-muted-foreground">
                  {(previewName || '?').trim().charAt(0)}
                </span>
              )}
              <p className="text-lg font-bold">{previewName || (ar ? 'اسم الشريك' : 'Partner name')}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{categoryLabel[form.category]}</Badge>
                {form.isActive ? <Badge>{t('faqs.active')}</Badge> : <Badge variant="secondary">—</Badge>}
              </div>
            </div>
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t('departments.content')}</p>
              {previewContent ? (
                <div className="prose-tiptap rounded-md border bg-card p-3 text-sm" dir={ar ? 'rtl' : 'ltr'}
                  dangerouslySetInnerHTML={{ __html: previewContent }} />
              ) : (
                <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {ar ? 'لا يوجد محتوى بعد' : 'No content yet'}
                </p>
              )}
            </div>
          </div>

          {/* slider of the other partners */}
          {others.length > 0 && (
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">{t('partners.others')}</p>
              <div className="flex gap-3 overflow-x-auto pb-2" dir="ltr">
                {others.map((p) => (
                  <Link key={p.id} to={`/partners/${p.id}`}
                    className="group flex w-32 shrink-0 flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center transition-colors hover:border-primary/50">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" className="max-h-10 w-auto object-contain" />
                    ) : (
                      <span className="flex size-10 items-center justify-center rounded-full bg-muted font-serif text-lg font-bold text-muted-foreground">
                        {(p.nameAr || '?').trim().charAt(0)}
                      </span>
                    )}
                    <span className="line-clamp-2 text-xs font-semibold" dir="rtl">{p.nameAr}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
