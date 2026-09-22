import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, Loader2, Pencil } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { RichTextEditor } from '@/components/shared/richtext-editor'

type CmsPage = {
  id: string
  slug: string
  titleAr: string
  titleEn: string
  contentAr: string | null
  contentEn: string | null
  isPublished: boolean
  updatedAt: string
}

export function PageEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    slug: '', titleAr: '', titleEn: '', contentAr: '', contentEn: '', isPublished: true,
  })
  const [loadedId, setLoadedId] = useState<string | null | undefined>(null)

  const pagesQuery = useQuery({
    queryKey: ['cms-pages'],
    queryFn: () => api<{ data: CmsPage[] }>('/content/admin/pages'),
  })

  useEffect(() => {
    if (isNew || !pagesQuery.data || loadedId === id) return
    const page = pagesQuery.data.data.find((p) => p.id === id)
    if (!page) return
    setForm({
      slug: page.slug,
      titleAr: page.titleAr,
      titleEn: page.titleEn,
      contentAr: page.contentAr ?? '',
      contentEn: page.contentEn ?? '',
      isPublished: page.isPublished,
    })
    setLoadedId(id)
  }, [pagesQuery.data, id, isNew, loadedId])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug,
        titleAr: form.titleAr,
        titleEn: form.titleEn,
        contentAr: form.contentAr || undefined,
        contentEn: form.contentEn || undefined,
        isPublished: form.isPublished,
      }
      return isNew
        ? api<{ id: string }>('/content/admin/pages', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
        : api<{ id: string }>(`/content/admin/pages/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['cms-pages'] })
      if (isNew) navigate(`/pages/${saved.id}`, { replace: true })
      else setLoadedId(undefined)
    },
    onError: (e: Error) => setError(e.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft
  const ar = tab === 'ar'
  const previewTitle = ar ? form.titleAr : form.titleEn
  const previewContent = ar ? form.contentAr : form.contentEn

  if (!isNew && pagesQuery.isLoading) {
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pages')} aria-label={t('pages.title')}>
          <BackIcon className="h-4 w-4" />
        </Button>
        <h1 className="flex-1 font-serif text-xl font-bold sm:text-2xl">
          {isNew ? t('pages.add') : `${t('pages.edit')} — ${form.titleAr || form.titleEn}`}
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
        {mode === 'edit' && (
          <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug <span className="text-muted-foreground">(URL)</span></Label>
                <Input dir="ltr" pattern="[a-z0-9-]+" placeholder="privacy"
                  value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                <p className="text-xs text-muted-foreground">{t('postCategories.slugAuto')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('pages.titleAr')}</Label>
                <Input dir="rtl" required value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('pages.titleEn')}</Label>
                <Input dir="ltr" required value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
              </div>
            </div>

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
              <input id="page-published" type="checkbox" className="size-4 accent-primary"
                checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
              <Label htmlFor="page-published">{t('pages.published')}</Label>
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

        {/* preview — public page mock */}
        <div className={cn(mode === 'edit' && 'lg:sticky lg:top-4 lg:self-start')}>
          <div className="overflow-hidden rounded-lg border">
            <div className="bg-muted/50 px-4 py-8 text-center">
              <p className="font-serif text-2xl font-bold">{previewTitle || (ar ? 'عنوان الصفحة' : 'Page title')}</p>
            </div>
            <div className="p-4">
              {previewContent ? (
                <div className="prose-tiptap text-sm" dir={ar ? 'rtl' : 'ltr'}
                  dangerouslySetInnerHTML={{ __html: previewContent }} />
              ) : (
                <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  {ar ? 'لا يوجد محتوى بعد' : 'No content yet'}
                </p>
              )}
            </div>
            {form.isPublished && (
              <div className="border-t bg-muted/30 px-4 py-2.5 text-center">
                <span className="text-xs font-semibold text-muted-foreground" dir="ltr">
                  /ar/{form.slug || 'slug'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
