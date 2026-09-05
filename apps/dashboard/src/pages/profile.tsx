import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth, type AuthUser } from '@/lib/auth'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { isValidPhone } from '@/lib/phone'
import { PhoneInput } from '@/components/shared/phone-input'

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="pe-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { user, updateCachedUser, authFetch } = useAuth()
  const { t, tLabel } = useI18n()

  // Profile form
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    if (phone.trim() !== '' && !isValidPhone(phone)) {
      setSaving(false)
      setError(t('phone.invalid'))
      return
    }
    try {
      const res = await authFetch('/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || null, phone: phone || null }),
      })
      if (!res.ok) throw new Error('Failed to save profile')
      const updated = await api<AuthUser>('/auth/me')
      if (updated) updateCachedUser(updated)
      setMessage(t('profile.saved'))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError(t('profile.passwordsMismatch'))
      return
    }
    setChanging(true)
    setPwMessage(null)
    setPwError(null)
    try {
      const res = await authFetch('/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword: confirmPassword }),
      })
      if (res.status === 401) throw new Error(t('profile.wrongCurrent'))
      if (!res.ok) throw new Error('Failed to change password')
      setPwMessage(t('profile.passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError((err as Error).message)
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
        {t('profile.title')}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {user?.username} · {user ? tLabel(`roles.${user.role}`) : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('profile.phone')}</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={setPhone}
                invalid={phone.trim() !== '' && !isValidPhone(phone)}
              />
            </div>
            {message && <p className="text-sm text-green-600">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t('action.saving') : t('action.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)]">
            {t('profile.changePassword')}
          </CardTitle>
          <CardDescription>{user?.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <PasswordField
              id="current-password"
              label={t('profile.currentPassword')}
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              label={t('profile.newPassword')}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              label={t('profile.confirmPassword')}
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            {pwMessage && <p className="text-sm text-green-600">{pwMessage}</p>}
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <Button type="submit" disabled={changing}>
              {changing && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('profile.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
