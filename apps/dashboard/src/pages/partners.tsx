import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
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

type Partner = {
  id: string
  nameAr: string
  nameEn: string
  category: 'insurance' | 'company' | 'authority'
  logoUrl: string | null
  websiteUrl: string | null
  sortOrder: number
  isActive: boolean
}

const CATEGORIES = ['insurance', 'company', 'authority'] as const

type PartnerForm = {
  nameAr: string
  nameEn: string
  category: string
  logoUrl: string
  websiteUrl: string
  sortOrder: string
  isActive: boolean
}

const emptyForm: PartnerForm = {
  nameAr: '', nameEn: '', category: 'insurance', logoUrl: '', websiteUrl: '', sortOrder: '0', isActive: true,
}

export function PartnersPage() {
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [deleting, setDeleting] = useState<Partner | null>(null)
  const [form, setForm] = useState<PartnerForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => api<{ data: Partner[] }>('/content/admin/partners'),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        category: form.category,
        logoUrl: form.logoUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      return editing
        ? api<Partner>(`/content/admin/partners/${editing.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
        : api<Partner>('/content/admin/partners', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      setDialogOpen(false)
    },
    onError: (e: Error) => setError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/content/admin/partners/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      setDeleting(null)
    },
  })

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(null); setDialogOpen(true)
  }
  function openEdit(p: Partner) {
    setEditing(p)
    setForm({
      nameAr: p.nameAr, nameEn: p.nameEn, category: p.category,
      logoUrl: p.logoUrl ?? '', websiteUrl: p.websiteUrl ?? '',
      sortOrder: String(p.sortOrder), isActive: p.isActive,
    })
    setError(null); setDialogOpen(true)
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); saveMutation.mutate()
  }

  const rows = listQuery.data?.data ?? []
  const categoryLabel: Record<string, string> = {
    insurance: t('partners.category.insurance'),
    company: t('partners.category.company'),
    authority: t('partners.category.authority'),
  }

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('partners.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('partners.add')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>{t('partners.nameAr')}</TableHead>
              <TableHead>{t('partners.nameEn')}</TableHead>
              <TableHead>{t('partners.category.label')}</TableHead>
              <TableHead>{t('faqs.sortOrder')}</TableHead>
              <TableHead>{t('faqs.active')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{t('partners.none')}</TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                  <TableCell className="font-medium" dir="rtl">{p.nameAr}</TableCell>
                  <TableCell dir="ltr">{p.nameEn}</TableCell>
                  <TableCell><Badge variant="outline">{categoryLabel[p.category]}</Badge></TableCell>
                  <TableCell>{p.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? t('faqs.active') : '—'}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                        <Ellipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" /> {t('partners.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(p)}>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('partners.edit') : t('partners.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('partners.logo')}</Label>
                <ImageInput value={form.logoUrl} onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('partners.website')}</Label>
                <Input dir="ltr" type="url" placeholder="https://…" value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="partner-active" type="checkbox" className="size-4 accent-primary"
                checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <Label htmlFor="partner-active">{t('faqs.active')}</Label>
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
            <AlertDialogTitle>{t('partners.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription dir="rtl">{deleting?.nameAr}</AlertDialogDescription>
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
