import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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

type PageForm = {
  slug: string
  titleAr: string
  titleEn: string
  contentAr: string
  contentEn: string
  isPublished: boolean
}

const emptyForm: PageForm = {
  slug: '', titleAr: '', titleEn: '', contentAr: '', contentEn: '', isPublished: true,
}

export function CmsPagesPage() {
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CmsPage | null>(null)
  const [deleting, setDeleting] = useState<CmsPage | null>(null)
  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [form, setForm] = useState<PageForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['cms-pages'],
    queryFn: () => api<{ data: CmsPage[] }>('/content/admin/pages'),
    placeholderData: keepPreviousData,
  })

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
      return editing
        ? api<CmsPage>(`/content/admin/pages/${editing.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
        : api<CmsPage>('/content/admin/pages', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cms-pages'] })
      setDialogOpen(false)
    },
    onError: (e: Error) => setError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/content/admin/pages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cms-pages'] })
      setDeleting(null)
    },
  })

  function openCreate() {
    setEditing(null); setForm(emptyForm); setTab('ar'); setError(null); setDialogOpen(true)
  }
  function openEdit(pg: CmsPage) {
    setEditing(pg)
    setForm({
      slug: pg.slug, titleAr: pg.titleAr, titleEn: pg.titleEn,
      contentAr: pg.contentAr ?? '', contentEn: pg.contentEn ?? '', isPublished: pg.isPublished,
    })
    setTab('ar'); setError(null); setDialogOpen(true)
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); saveMutation.mutate()
  }

  const rows = listQuery.data?.data ?? []
  const ar = tab === 'ar'

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('pages.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('pages.add')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>{t('pages.titleAr')}</TableHead>
              <TableHead>{t('pages.titleEn')}</TableHead>
              <TableHead>{t('pages.published')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t('pages.none')}</TableCell>
              </TableRow>
            ) : (
              rows.map((pg) => (
                <TableRow key={pg.id} className="cursor-pointer" onClick={() => openEdit(pg)}>
                  <TableCell className="text-muted-foreground" dir="ltr">{pg.slug}</TableCell>
                  <TableCell className="font-medium" dir="rtl">{pg.titleAr}</TableCell>
                  <TableCell dir="ltr">{pg.titleEn}</TableCell>
                  <TableCell>
                    <Badge variant={pg.isPublished ? 'default' : 'secondary'}>
                      {pg.isPublished ? t('pages.published') : t('departments.draft')}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                        <Ellipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => openEdit(pg)}>
                          <Pencil className="h-4 w-4" /> {t('pages.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(pg)}>
                          <Trash2 className="h-4 w-4" /> {t('common.delete')}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? t('pages.edit') : t('pages.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug <span className="text-muted-foreground">(URL)</span></Label>
                <Input dir="ltr" required pattern="[a-z0-9-]+" placeholder="privacy"
                  value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
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
              <input
                id="page-published" type="checkbox" className="size-4 accent-primary"
                checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              <Label htmlFor="page-published">{t('pages.published')}</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription dir="rtl">{deleting?.titleAr}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && deleteMutation.mutate(deleting.id)}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
