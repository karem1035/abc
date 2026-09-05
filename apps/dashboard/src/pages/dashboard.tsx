import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function DashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
        {t('dashboard.welcome', { name: user?.name ?? '' })}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t('dashboard.signedInAs', { username: user?.username ?? '', role: user?.role ?? '' })}
      </p>
      <p className="text-sm text-muted-foreground">{t('dashboard.scaffold')}</p>
    </div>
  )
}
