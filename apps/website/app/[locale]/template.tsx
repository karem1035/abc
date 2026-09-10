import type { ReactNode } from 'react'

// Next remounts templates on page navigation; query-only filters animate their results separately.
export default function PageTemplate({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>
}
