import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { slugify } from '@/lib/slugify'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
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

type Category = {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  sortOrder: number
}

type CategoryForm = { nameAr: string; nameEn: string; slug: string; sortOrder: string }

const emptyForm: CategoryForm = { nameAr: '', nameEn: '', slug: '', sortOrder: '0' }

export function PostCategoriesPage() {
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['post-categories'],
    queryFn: () => api<{ data: Category[] }>('/post-categories/admin/'),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        slug: form.slug.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      }
      return editing
        ? api<Category>(`/post-categories/admin/${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : api<Category>('/post-categories/admin/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['post-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['posts'] })
      setDialogOpen(false)
      toast.success(t('toast.saved'))
    },
    onError: (e: Error) => { setError(e.message); toast.error(e.message) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/post-categories/admin/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['post-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['posts'] })
      setDeleting(null)
      toast.success(t('toast.deleted'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug, sortOrder: String(cat.sortOrder) })
    setError(null)
    setDialogOpen(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const rows = listQuery.data?.data ?? []

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('postCategories.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('postCategories.add')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t('postCategories.nameAr')}</TableHead>
              <TableHead>{t('postCategories.nameEn')}</TableHead>
              <TableHead dir="ltr">{t('postCategories.slug')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t('postCategories.none')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-muted-foreground">{cat.sortOrder}</TableCell>
                  <TableCell dir="rtl" className="font-medium">{cat.nameAr}</TableCell>
                  <TableCell dir="ltr">{cat.nameEn}</TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                        <Ellipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => openEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                          {t('postCategories.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(cat)}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('postCategories.edit') : t('postCategories.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('postCategories.nameAr')}</Label>
              <Input dir="rtl" required maxLength={100} value={form.nameAr}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value, slug: slugify(f.nameEn || e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('postCategories.nameEn')}</Label>
              <Input dir="ltr" required maxLength={100} value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value, slug: slugify(e.target.value || f.nameAr) }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('postCategories.slug')}</Label>
                <Input dir="ltr" maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder={t('postCategories.slugAuto')} />
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.sortOrder')}</Label>
                <Input type="number" value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
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
            <AlertDialogTitle>{t('postCategories.deleteConfirm')}</AlertDialogTitle>
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
