import React, { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

type Faq = {
  id: string
  page: string
  questionAr: string
  questionEn: string
  answerAr: string
  answerEn: string
  sortOrder: number
  isActive: boolean
}

const FAQ_PAGES = ['contact', 'home', 'departments', 'doctors', 'news'] as const

type FaqForm = {
  page: string
  questionAr: string
  questionEn: string
  answerAr: string
  answerEn: string
  sortOrder: string
  isActive: boolean
}

const emptyForm: FaqForm = {
  page: 'contact',
  questionAr: '',
  questionEn: '',
  answerAr: '',
  answerEn: '',
  sortOrder: '0',
  isActive: true,
}

export function FaqsPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [deleting, setDeleting] = useState<Faq | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<FaqForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const faqsQuery = useQuery({
    queryKey: ['faqs'],
    queryFn: () => api<{ data: Faq[] }>('/contact/admin/faqs'),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        page: form.page,
        questionAr: form.questionAr,
        questionEn: form.questionEn,
        answerAr: form.answerAr,
        answerEn: form.answerEn,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      return editing
        ? api<Faq>(`/contact/admin/faqs/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : api<Faq>('/contact/admin/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faqs'] })
      setDialogOpen(false)
      toast.success(t('toast.saved'))
    },
    onError: (e: Error) => { setError(e.message); toast.error(e.message) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/contact/admin/faqs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faqs'] })
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

  function openEdit(faq: Faq) {
    setEditing(faq)
    setForm({
      page: faq.page,
      questionAr: faq.questionAr,
      questionEn: faq.questionEn,
      answerAr: faq.answerAr,
      answerEn: faq.answerEn,
      sortOrder: String(faq.sortOrder),
      isActive: faq.isActive,
    })
    setError(null)
    setDialogOpen(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  const rows = faqsQuery.data?.data ?? []
  const dir = useI18n().dir

  // group FAQs by page, each section gets its own table sorted by order
  const sections = [...new Set(rows.map((f) => f.page))].map((page) => ({
    page,
    faqs: rows.filter((f) => f.page === page),
  }))

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('faqs.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('faqs.add')}
        </Button>
      </div>

      {faqsQuery.isLoading ? (
        <div className="rounded-lg border">
          <Table>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {t('faqs.none')}
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.page} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{section.page}</Badge>
              <span className="text-xs text-muted-foreground">({section.faqs.length})</span>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-160">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>{t('faqs.questionAr')}</TableHead>
                    <TableHead>{t('faqs.questionEn')}</TableHead>
                    <TableHead>{t('faqs.active')}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.faqs.map((faq) => (
                    <React.Fragment key={faq.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpanded((prev) => (prev === faq.id ? null : faq.id))
                      }
                    >
                      <TableCell className="text-muted-foreground">{faq.sortOrder}</TableCell>
                      <TableCell className="max-w-64 truncate" dir="rtl">{faq.questionAr}</TableCell>
                      <TableCell className="max-w-64 truncate" dir="ltr">{faq.questionEn}</TableCell>
                      <TableCell>
                        <Badge variant={faq.isActive ? 'default' : 'secondary'}>
                          {faq.isActive ? t('faqs.active') : '—'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                            <Ellipsis className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => openEdit(faq)}>
                              <Pencil className="h-4 w-4" />
                              {t('faqs.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(faq)}>
                              <Trash2 className="h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expanded === faq.id && (
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={5} className="px-4 py-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t('faqs.answerAr')}</p>
                              <p className="text-sm leading-relaxed" dir="rtl">{faq.answerAr}</p>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t('faqs.answerEn')}</p>
                              <p className="text-sm leading-relaxed" dir="ltr">{faq.answerEn}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t('faqs.edit') : t('faqs.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('faqs.page')}</Label>
                <Select value={form.page} onValueChange={(v) => setForm((f) => ({ ...f, page: v ?? 'contact' }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FAQ_PAGES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.sortOrder')}</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('faqs.questionAr')}</Label>
                <Textarea
                  dir="rtl" required
                  value={form.questionAr}
                  onChange={(e) => setForm((f) => ({ ...f, questionAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.questionEn')}</Label>
                <Textarea
                  dir="ltr" required
                  value={form.questionEn}
                  onChange={(e) => setForm((f) => ({ ...f, questionEn: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('faqs.answerAr')}</Label>
                <Textarea
                  dir="rtl" required rows={3}
                  value={form.answerAr}
                  onChange={(e) => setForm((f) => ({ ...f, answerAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('faqs.answerEn')}</Label>
                <Textarea
                  dir="ltr" required rows={3}
                  value={form.answerEn}
                  onChange={(e) => setForm((f) => ({ ...f, answerEn: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="faq-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="faq-active">{t('faqs.active')}</Label>
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
            <AlertDialogTitle>{t('faqs.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription dir="rtl">{deleting?.questionAr}</AlertDialogDescription>
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
