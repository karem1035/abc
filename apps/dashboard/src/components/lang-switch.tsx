import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function LangSwitch() {
  const { locale, setLocale } = useI18n()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
    >
      <Languages className="h-4 w-4" />
      {locale === 'ar' ? 'English' : 'العربية'}
    </Button>
  )
}
