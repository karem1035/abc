import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { LangSwitch } from '@/components/lang-switch'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function LoginPage() {
  const { login } = useAuth()
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const ar = locale === 'ar'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await login(username, password)
    setSubmitting(false)
    if (result.ok) {
      navigate('/', { replace: true })
    } else {
      setError(t('login.invalid'))
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/40 font-sans">
      <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/abc-logo.webp" alt="ABC" className="size-10 object-contain" />
          <span className="text-sm font-semibold">{ar ? 'مستشفى ABC' : 'ABC Hospital'}</span>
        </div>
        <div className="flex items-center gap-1">
          <LangSwitch />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-border/80 bg-card px-6 py-8 shadow-sm sm:p-10">
            <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
              <LockKeyhole className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('login.title')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('login.description')}</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">{t('login.username')}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                  className="h-11 rounded-lg bg-background"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-11 rounded-lg bg-background pe-12"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 end-1 my-auto flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p id="login-error" role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={submitting} className="h-11 w-full rounded-lg text-sm font-semibold">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t('login.submit')}
              </Button>
            </form>
          </div>
          <p className="mx-auto mt-6 max-w-xs text-center text-xs leading-5 text-muted-foreground">
            {ar
              ? 'لأعضاء فريق مستشفى ABC فقط — تواصل مع الإدارة للحصول على حساب.'
              : 'For ABC Hospital staff only — contact administration for an account.'}
          </p>
        </div>
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-muted-foreground">
        {ar ? 'لوحة تحكم فريق مستشفى ABC' : 'ABC Hospital · Team dashboard'}
      </footer>
    </div>
  )
}
