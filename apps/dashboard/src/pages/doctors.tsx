import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
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

export function DoctorsPage() {
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<Doctor | null>(null)

  const listQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api<{ data: Doctor[] }>('/departments/admin/doctors'),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/departments/admin/doctors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctors'] })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDeleting(null)
      toast.success(t('toast.deleted'))
    },
  })

  const rows = listQuery.data?.data ?? []
  const statusLabel: Record<string, string> = {
    published: t('departments.published'),
    draft: t('departments.draft'),
    archived: t('departments.archived'),
  }

  return (
    <div className="space-y-4 p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">{t('doctors.title')}</h1>
        <Button onClick={() => navigate('/doctors/new')}>
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
                <TableRow key={doc.id} className="cursor-pointer" onClick={() => navigate(`/doctors/${doc.id}`)}>
                  <TableCell className="font-medium" dir="rtl">{doc.nameAr}</TableCell>
                  <TableCell dir="ltr">{doc.nameEn}</TableCell>
                  <TableCell className="max-w-48 truncate" dir="rtl">{doc.titleAr ?? '—'}</TableCell>
                  <TableCell dir="rtl">{doc.departmentName ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'published' ? 'default' : 'secondary'}>
                      {statusLabel[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('common.actions')} />}>
                        <Ellipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => navigate(`/doctors/${doc.id}`)}>
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
