import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function DashboardPage() {
  const { user } = useAuth()
  const { t, tLabel, locale } = useI18n()
  const [configured, setConfigured] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => { if (user?.role === 'admin') api<{ configured: boolean }>('/deployment').then(r => setConfigured(r.configured)).catch(() => setConfigured(false)) }, [user?.role])
  async function deploy() {
    setBusy(true)
    setMessage('')
    try { await api('/deployment', { method: 'POST' }); setMessage(locale === 'ar' ? 'تم إرسال طلب النشر. تابع تقدم البناء من لوحة الاستضافة.' : 'Deployment requested. Follow build progress in your hosting dashboard.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Deployment failed') }
    finally { setBusy(false) }
  }
  return (
    <div className="space-y-2">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
        {t('dashboard.welcome', { name: user?.name ?? '' })}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t('dashboard.signedInAs', {
          username: user?.username ?? '',
          role: user ? tLabel(`roles.${user.role}`) : '',
        })}
      </p>
      {user?.role === 'admin' && <div className="mt-6 space-y-3 rounded-xl border p-5">
        <h2 className="font-semibold">{locale === 'ar' ? 'نشر الموقع' : 'Website deployment'}</h2>
        <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'انشر نسخة جديدة من الموقع بعد الانتهاء من تعديل المحتوى.' : 'Build and deploy the website after finishing your content edits.'}</p>
        {!configured && <p className="text-sm">{locale === 'ar' ? 'يلزم إعداد رابط نشر Coolify ورمز API على الخادم لتفعيل النشر.' : 'Set DEPLOY_HOOK_URL and DEPLOY_HOOK_TOKEN on the backend to enable deployments.'}</p>}
        <button disabled={!configured || busy} onClick={deploy} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50">{busy ? (locale === 'ar' ? 'جارٍ الإرسال…' : 'Requesting…') : (locale === 'ar' ? 'نشر الموقع' : 'Deploy website')}</button>
        {message && <p role="status" className="text-sm">{message}</p>}
      </div>}
    </div>
  )
}
