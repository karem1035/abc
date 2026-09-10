import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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

export function DepartmentsPage() {
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState<Department | null>(null)
  const [tab, setTab] = useState<'ar' | 'en'>('ar')
  const [form, setForm] = useState<DeptForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ data: Department[] }>('/departments/admin/'),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug,
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        descriptionAr: form.descriptionAr || undefined,
        descriptionEn: form.descriptionEn || undefined,
        contentAr: form.contentAr || undefined,
        contentEn: form.contentEn || undefined,
        imageUrl: form.imageUrl || undefined,
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
      setDialogOpen(false)
    },
    onError: (e: Error) => setError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/departments/admin/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDeleting(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setTab('ar')
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(dept: Department) {
    setEditing(dept)
    setForm({
      slug: dept.slug,
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      descriptionAr: dept.descriptionAr ?? '',
      descriptionEn: dept.descriptionEn ?? '',
      contentAr: dept.contentAr ?? '',
      contentEn: dept.contentEn ?? '',
      imageUrl: dept.imageUrl ?? '',
      sortOrder: String(dept.sortOrder),
      status: dept.status,
    })
    setTab('ar')
    setError(null)
    setDialogOpen(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const rows = listQuery.data?.data ?? []
  const statusLabel: Record<string, string> = {
    published: t('departments.published'),
    draft: t('departments.draft'),
    archived: t('departments.archived'),
  }

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('departments.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('departments.add')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>{t('departments.nameAr')}</TableHead>
              <TableHead>{t('departments.nameEn')}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>{t('departments.doctorsCount')}</TableHead>
              <TableHead>{t('faqs.sortOrder')}</TableHead>
              <TableHead>{t('departments.status')}</TableHead>
              <TableHead className="w-12" />
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
                  {t('departments.none')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((dept) => (
                <TableRow key={dept.id} className="cursor-pointer" onClick={() => openEdit(dept)}>
                  <TableCell className="font-medium" dir="rtl">{dept.nameAr}</TableCell>
                  <TableCell dir="ltr">{dept.nameEn}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{dept.slug}</TableCell>
                  <TableCell>{dept.doctorsCount ?? 0}</TableCell>
                  <TableCell>{dept.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={dept.status === 'published' ? 'default' : 'secondary'}>
                      {statusLabel[dept.status]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                        <Ellipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => openEdit(dept)}>
                          <Pencil className="h-4 w-4" />
                          {t('departments.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(dept)}>
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
            <DialogTitle>{editing ? t('departments.edit') : t('departments.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label>{t('departments.image')}</Label>
              <ImageInput
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              />
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
            <AlertDialogTitle>{t('departments.deleteConfirm')}</AlertDialogTitle>
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
