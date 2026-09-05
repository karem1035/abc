import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Loader2, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { api } from '@/api/client'
import { useAuth, type AuthUser } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { isValidPhone } from '@/lib/phone'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_PAGE_SIZE,
  TablePagination,
} from '@/components/shared/table-pagination'
import { PhoneInput } from '@/components/shared/phone-input'

type UsersResponse = {
  data: AuthUser[]
  page: number
  limit: number
  total: number
}

const ROLES = ['admin', 'call_center', 'marketer'] as const
type Role = (typeof ROLES)[number]

type UserForm = {
  name: string
  username: string
  password: string
  role: Role
  phone: string
  email: string
  isActive: boolean
}

const emptyForm: UserForm = {
  name: '',
  username: '',
  password: '',
  role: 'marketer',
  phone: '',
  email: '',
  isActive: true,
}

function UserDialog({
  open,
  onOpenChange,
  editing,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: AuthUser | null
  onSuccess: () => void
}) {
  const { t, tLabel } = useI18n()
  const { user: me } = useAuth()
  const isSelf = editing && me && editing.id === me.id
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Reset the form whenever the dialog opens for a create or a different user
  const dialogKey = editing?.id ?? 'create'
  const [lastKey, setLastKey] = useState<string | null>(null)
  if (open && lastKey !== dialogKey) {
    setLastKey(dialogKey)
    setError(null)
    setForm(
      editing
        ? {
            name: editing.name,
            username: editing.username,
            password: '',
            role: editing.role as Role,
            phone: editing.phone ?? '',
            email: editing.email ?? '',
            isActive: editing.isActive,
          }
        : emptyForm,
    )
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const body: Record<string, unknown> = {
          name: form.name,
          role: form.role,
          isActive: form.isActive,
          phone: form.phone || null,
          email: form.email || null,
        }
        if (form.password) body.password = form.password
        const res = await apiFetch(`/users/${editing.id}`, { method: 'PATCH', body })
        return res
      }
      return apiFetch('/users', { method: 'POST', body: { ...form, phone: form.phone || undefined, email: form.email || undefined } })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
      onSuccess()
    },
    onError: (err: Error) => {
      setError(err.message.includes('taken') ? t('users.usernameTaken') : err.message)
    },
  })

  async function apiFetch(path: string, { method, body }: { method: string; body: Record<string, unknown> }) {
    const res = await api<{ error?: string }>(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((err: Error) => {
      throw err
    })
    return res
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.phone.trim() !== '' && !isValidPhone(form.phone)) {
      setError(t('phone.invalid'))
      return
    }
    mutation.mutate()
  }

  const set = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-heading)]">
            {editing ? t('users.edit') : t('users.create')}
          </DialogTitle>
          <DialogDescription>{editing?.username}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">{t('users.name')}</Label>
            <Input id="user-name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          {!editing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="user-username">{t('users.username')}</Label>
                <Input
                  id="user-username"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  dir="ltr"
                  required
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">{t('users.password')}</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                  minLength={4}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="user-role">{t('users.role')}</Label>
            <Select value={form.role} onValueChange={(v) => set('role', v as Role)}>
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role} label={tLabel(`roles.${role}`)}>
                    {tLabel(`roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">{t('users.email')}</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-phone">{t('users.phone')}</Label>
            <PhoneInput
              id="user-phone"
              value={form.phone}
              onChange={(v) => set('phone', v)}
              invalid={form.phone.trim() !== '' && !isValidPhone(form.phone)}
            />
          </div>
          {editing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="user-new-password">
                  {t('users.password')} <span className="text-muted-foreground">({t('users.optional')})</span>
                </Label>
                <Input
                  id="user-new-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  minLength={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="user-active">{t('users.active')}</Label>
                <Switch
                  id="user-active"
                  checked={form.isActive}
                  disabled={Boolean(isSelf)}
                  onCheckedChange={(v) => set('isActive', v)}
                />
              </div>
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('users.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? t('users.save') : t('users.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  user,
  onClose,
}: {
  user: AuthUser | null
  onClose: () => void
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      await api(`/users/${user.id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <AlertDialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-[family-name:var(--font-heading)]">
            {t('users.delete')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('users.deleteConfirm', { name: user?.name ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{t('users.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('users.deleteBtn')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function UsersPage() {
  const { t, tLabel } = useI18n()
  const { user: me } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AuthUser | null>(null)
  const [deleting, setDeleting] = useState<AuthUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => api<UsersResponse>(`/users?page=${page}&limit=${pageSize}`),
    placeholderData: keepPreviousData,
  })

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(user: AuthUser) {
    setEditing(user)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{t('users.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('users.create')}
        </Button>
      </div>
      {toast && <p className="text-sm text-green-600">{toast}</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.name')}</TableHead>
                  <TableHead>{t('users.username')}</TableHead>
                  <TableHead>{t('users.role')}</TableHead>
                  <TableHead>{t('users.active')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {t('audit.noResults')}
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {u.email ?? u.phone ?? ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell dir="ltr">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tLabel(`roles.${u.role}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'default' : 'secondary'}>
                        {u.isActive ? t('users.active') : t('users.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t('users.actions')} />}>
                          <Ellipsis className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="h-4 w-4" />
                            {t('users.editBtn')}
                          </DropdownMenuItem>
                          {u.id !== me?.id && (
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(u)}>
                              <Trash2 className="h-4 w-4" />
                              {t('users.deleteBtn')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        editing={editing}
        onSuccess={() => setToast(editing ? t('users.updated') : t('users.created'))}
      />
      <DeleteDialog
        user={deleting}
        onClose={() => {
          setDeleting(null)
          setToast(t('users.deleted'))
        }}
      />
    </div>
  )
}
