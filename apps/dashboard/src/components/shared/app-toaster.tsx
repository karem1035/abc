import { Toaster } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'

/** Single mounted Sonner toaster, RTL- and theme-aware. */
export function AppToaster() {
  const { dir } = useI18n()
  const { resolved } = useTheme()
  return <Toaster position="bottom-center" dir={dir} theme={resolved} richColors closeButton />
}
