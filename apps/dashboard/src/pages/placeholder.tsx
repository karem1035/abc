import { useI18n } from '@/lib/i18n'

export function PlaceholderPage({ title }: { title: string }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
    </div>
  )
}
