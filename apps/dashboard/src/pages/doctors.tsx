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

type DoctorForm = {
  slug: string
  nameAr: string
  nameEn: string
  titleAr: string
  titleEn: string
  photoUrl: string
  departmentId: string
  sortOrder: string
  status: string
}

const emptyForm: DoctorForm = {
  slug: '',
  nameAr: '',
  nameEn: '',
  titleAr: '',
  titleEn: '',
  photoUrl: '',
  departmentId: '',
  sortOrder: '0',
  status: 'published',
}

export function DoctorsPage() {
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [deleting, setDeleting] = useState<Doctor | null>(null)
  const [form, setForm] = useState<DoctorForm>(emptyForm)
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
        photoUrl: form.photoUrl || undefined,
        departmentId: form.departmentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      }
      return editing
        ? api<Doctor>(`/departments/admin/doctors/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : api<Doctor>('/departments/admin/doctors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
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
      photoUrl: doc.photoUrl ?? '',
      departmentId: doc.departmentId ?? '',
      sortOrder: String(doc.sortOrder),
      status: doc.status,
    })
    setError(null)
    setDialogOpen(true)
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
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
