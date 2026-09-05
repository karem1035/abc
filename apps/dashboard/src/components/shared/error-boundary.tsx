import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * App-wide error boundary: keeps the dashboard usable (and debuggable)
 * instead of turning into a blank page when a render throws.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  override render() {
    if (!this.state.error) return this.props.children

    const isAr = document.documentElement.lang === 'ar'

    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center text-card-foreground shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold">
            {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'حدث خطأ في الواجهة. يمكنك المحاولة مرة أخرى — إذا استمرت المشكلة أعد تحميل الصفحة.'
              : 'The UI hit an error. You can try again — reload the page if it keeps happening.'}
          </p>
          <details className="text-start">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              {isAr ? 'تفاصيل الخطأ' : 'Error details'}
            </summary>
            <pre
              dir="ltr"
              className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2 font-mono text-xs"
            >
              {this.state.error.message}
            </pre>
          </details>
          <div className="flex justify-center gap-2">
            <Button onClick={this.reset}>
              <RotateCcw className="h-4 w-4" />
              {isAr ? 'المحاولة مرة أخرى' : 'Try again'}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {isAr ? 'إعادة تحميل الصفحة' : 'Reload page'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
