import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AuthUser } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type UsersResponse = { data: AuthUser[] }

export function UsersPage() {
  const { t } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<UsersResponse>('/users'),
  })

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{t('users.title')}</h1>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.name')}</TableHead>
                <TableHead>{t('users.username')}</TableHead>
                <TableHead>{t('users.role')}</TableHead>
                <TableHead>{t('users.active')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'default' : 'secondary'}>
                      {u.isActive ? t('users.active') : t('users.inactive')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
