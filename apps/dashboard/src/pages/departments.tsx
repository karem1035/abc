import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function DepartmentsPage() {
  const { t, dir } = useI18n()
  const queryClient = useQueryClient()

  const navigate = useNavigate()
  const [deleting, setDeleting] = useState<Department | null>(null)

  const listQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ data: Department[] }>('/departments/admin/'),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<void>(`/departments/admin/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDeleting(null)
      toast.success(t('toast.deleted'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openCreate() { navigate('/departments/new') }
  function openEdit(dept: Department) { navigate(`/departments/${dept.id}/edit`) }

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
