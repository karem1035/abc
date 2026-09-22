import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { ThemeProvider } from './lib/theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DirectionProvider } from '@/components/ui/direction'
import { AppToaster } from '@/components/shared/app-toaster'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { I18nProvider, useI18n } from './lib/i18n'
import './index.css'

function Direction({ children }: { children: React.ReactNode }) {
  const { dir } = useI18n()
  return <DirectionProvider direction={dir}>{children}</DirectionProvider>
}

// All server data is considered fresh for 5 minutes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <Direction>
                  <BrowserRouter>
                    <TooltipProvider>
                      <App />
                      <AppToaster />
                    </TooltipProvider>
                  </BrowserRouter>
            </Direction>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
