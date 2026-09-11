import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  CalendarCheck, Inbox, Newspaper, PieChart as PieIcon, Rocket,
  Stethoscope, TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

type Stats = {
  bookings: {
    total: number; new: number; confirmed: number; last7: number
    byStatus: Array<{ status: string; count: number }>
    bySource: Array<{ source: string; count: number }>
    series: Array<{ date: string; bookings: number }>
  }
  contacts: { total: number; new: number; last7: number }
  content: { doctors: number; departments: number; posts: number; faqs: number }
}

const STATUS_COLORS: Record<string, string> = {
  new: '#d4ae6e', contacted: '#7aa5c4', confirmed: '#5c9e6c',
  completed: '#4a7d5c', declined: '#c46b6b', cancelled: '#9b8f83',
}
const SOURCE_COLORS = ['#d4ae6e', '#7aa5c4', '#a48249']

function StatCard({ icon: Icon, label, value, hint, href }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number | string
  hint?: string; href?: string
}) {
  const inner = (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
  return href ? <Link to={href} className="block">{inner}</Link> : inner
}

export function DashboardPage() {
  const { user } = useAuth()
  const { t, tLabel, locale } = useI18n()
  const ar = locale === 'ar'

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () => api<Stats>('/stats'),
    refetchInterval: 60_000,
  })

  // Coolify deploy hook (kept from the deployment card)
  const [deployConfigured, setDeployConfigured] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployMessage, setDeployMessage] = useState('')
  useEffect(() => {
    if (user?.role === 'admin') {
      api<{ configured: boolean }>('/deployment')
        .then((r) => setDeployConfigured(r.configured))
        .catch(() => setDeployConfigured(false))
    }
  }, [user?.role])

  async function deploy() {
    setDeploying(true)
    setDeployMessage('')
    try {
      await api('/deployment', { method: 'POST' })
      setDeployMessage(ar ? 'تم إرسال طلب النشر — تابع البناء من Coolify.' : 'Deployment requested — follow the build in Coolify.')
    } catch (error) {
      setDeployMessage(error instanceof Error ? error.message : 'failed')
    } finally {
      setDeploying(false)
    }
  }

  const role = user?.role
  const showBookings = role === 'admin' || role === 'call_center'
  const showContent = role === 'admin' || role === 'marketer'
  const stats = statsQuery.data

  const statusLabels: Record<string, string> = {
    new: tLabel('bookings.status.new'), contacted: tLabel('bookings.status.contacted'),
    confirmed: tLabel('bookings.status.confirmed'), completed: tLabel('bookings.status.completed'),
    declined: tLabel('bookings.status.declined'), cancelled: tLabel('bookings.status.cancelled'),
  }
  const sourceLabels: Record<string, string> = {
    website: tLabel('bookings.source.website'), walk_in: tLabel('bookings.source.walk_in'),
    phone: tLabel('bookings.source.phone'),
  }

  const pieData = (stats?.bookings.byStatus ?? []).map((s) => ({
    name: statusLabels[s.status] ?? s.status, value: s.count, key: s.status,
  }))
  const sourceData = (stats?.bookings.bySource ?? []).map((s) => ({
    name: sourceLabels[s.source] ?? s.source, value: s.count,
  }))

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold lg:text-2xl">
          {t('dashboard.welcome', { name: user?.name ?? '' })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.signedInAs', {
            username: user?.username ?? '',
            role: user ? tLabel(`roles.${user.role}`) : '',
          })}
        </p>
      </div>

      {statsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{ar ? 'جارٍ تحميل الإحصائيات…' : 'Loading stats…'}</p>
      ) : statsQuery.isError ? (
        <p className="text-sm text-destructive">{ar ? 'تعذر تحميل الإحصائيات' : 'Could not load stats'}</p>
      ) : (
        <>
          {/* headline cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {showBookings && (
              <StatCard icon={CalendarCheck} label={t('bookings.title')} value={stats!.bookings.total}
                hint={`${stats!.bookings.new} ${t('bookings.status.new')} · +${stats!.bookings.last7} (7d)`} href="/bookings" />
            )}
            {showBookings && (
              <StatCard icon={Inbox} label={t('submissions.title')} value={stats!.contacts.total}
                hint={`${stats!.contacts.new} ${t('bookings.status.new')}`} href="/contact-submissions" />
            )}
            {showContent && (
              <StatCard icon={Stethoscope} label={t('doctors.title')} value={stats!.content.doctors}
                hint={`${stats!.content.departments} ${t('departments.title')}`} href="/doctors" />
            )}
            {showContent && (
              <StatCard icon={Newspaper} label={t('nav.content')} value={stats!.content.posts}
                hint={`${stats!.content.faqs} ${t('faqs.title')}`} href="/content" />
            )}
          </div>

          {/* charts */}
          {showBookings && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
                  <TrendingUp className="size-4 text-primary" />
                  {ar ? 'طلبات المواعيد — آخر ١٤ يومًا' : 'Appointment requests — last 14 days'}
                </h2>
                <div className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats!.bookings.series} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4ae6e" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#d4ae6e" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'ltr' }} />
                      <Area type="monotone" dataKey="bookings" stroke="#b8934f" strokeWidth={2} fill="url(#bookingsFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
                  <PieIcon className="size-4 text-primary" />
                  {ar ? 'حالة الطلبات' : 'Requests by status'}
                </h2>
                {pieData.length === 0 ? (
                  <p className="py-16 text-center text-xs text-muted-foreground">{ar ? 'لا توجد طلبات بعد' : 'No requests yet'}</p>
                ) : (
                  <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                          {pieData.map((entry) => (
                            <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#9b8f83'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {pieData.map((entry) => (
                    <li key={entry.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.key] ?? '#9b8f83' }} />
                      {entry.name} ({entry.value})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showBookings && sourceData.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-bold">{ar ? 'مصدر الطلبات' : 'Requests by source'}</h2>
              <div className="h-44" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Coolify deploy (admin) */}
      {user?.role === 'admin' && deployConfigured && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <Rocket className="size-5 text-primary" />
            <div>
              <p className="text-sm font-bold">{ar ? 'نشر جديد' : 'Deploy a new release'}</p>
              <p className="text-xs text-muted-foreground">{ar ? 'أطلق بناء Coolify بعد تعديل المحتوى.' : 'Trigger the Coolify build after content edits.'}</p>
            </div>
          </div>
          <button
            onClick={deploy}
            disabled={deploying}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {deploying ? (ar ? 'جارٍ الإرسال…' : 'Requesting…') : ar ? 'نشر' : 'Deploy'}
          </button>
          {deployMessage && <p role="status" className="w-full text-xs text-muted-foreground">{deployMessage}</p>}
        </div>
      )}
    </div>
  )
}
