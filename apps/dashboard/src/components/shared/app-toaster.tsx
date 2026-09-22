import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'
import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'

/** Single mounted Sonner toaster, RTL- and theme-aware. */
export function AppToaster() {
  const { dir } = useI18n()
  const { resolved } = useTheme()
  return (
    <Toaster
      position="top-center"
      dir={dir}
      theme={resolved}
      richColors
      closeButton
      duration={4000}
      visibleToasts={4}
    />
  )
}
