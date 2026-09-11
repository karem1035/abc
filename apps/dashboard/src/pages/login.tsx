import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
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
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4">
      {/* language / theme controls */}
      <div className="absolute top-3 end-3 z-10 flex items-center gap-1">
        <LangSwitch />
        <ThemeToggle />
      </div>

      <div className="login-shell">
        {/* branding side */}
        <div className="login-aside">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-side.jpg" alt="" className="login-aside-img" aria-hidden="true" />
          <div className="login-aside-overlay" aria-hidden="true" />
          <div className="login-aside-content">
            <img src="/abc-logo.webp" alt="ABC" className="h-14 w-14 rounded-xl object-contain" />
            <h1>{ar ? 'مستشفى ABC' : 'ABC HOSPITAL'}</h1>
            <p>
              {ar
                ? 'أول مستشفى معتمد دوليًا في جراحات السمنة والتميز الجراحي — لوحة تحكم الفريق.'
                : 'The first internationally accredited bariatric center of excellence — team console.'}
            </p>
            <span className="login-aside-badge">
              <ShieldCheck className="size-3.5" />
              {ar ? 'معتمد من SRC الأمريكية' : 'SRC ACCREDITED'}
            </span>
          </div>
        </div>

        {/* form side */}
        <div className="login-panel">
          <div className="w-full max-w-sm">
            <img src="/abc-logo.webp" alt="ABC" className="mx-auto mb-5 h-16 w-16 rounded-xl object-contain lg:hidden" />
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
              {t('login.title')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t('login.description')}</p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('login.username')}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
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
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 end-2 my-auto flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={submitting} className="h-11 w-full text-sm font-bold">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t('login.submit')}
              </Button>
            </form>

            <p className="mt-8 text-xs text-muted-foreground">
              {ar
                ? 'لأعضاء فريق مستشفى ABC فقط — تواصل مع الإدارة للحصول على حساب.'
                : 'For ABC Hospital staff only — contact administration for an account.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
