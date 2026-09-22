import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

export function CmsPagesPage() {
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [deleting, setDeleting] = useState<CmsPage | null>(null)

  const listQuery = useQuery({
    queryKey: ['cms-pages'],
    queryFn: () => api<{ data: CmsPage[] }>('/content/admin/pages'),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/content/admin/pages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cms-pages'] })
      setDeleting(null)
      toast.success(t('toast.deleted'))
    },
    onError: (e: Error) => toast.error(e.message),
  })


  const rows = listQuery.data?.data ?? []

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('pages.title')}</h1>
        <Button onClick={() => navigate('/pages/new')}>
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
                <TableRow key={pg.id} className="cursor-pointer" onClick={() => navigate(`/pages/${pg.id}`)}>
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
                        <DropdownMenuItem onClick={() => navigate(`/pages/${pg.id}`)}>
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
