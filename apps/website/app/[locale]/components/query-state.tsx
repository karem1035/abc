'use client'
import { Suspense, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useSearchParams } from 'next/navigation'

function Reader({ onChange }: { onChange: Dispatch<SetStateAction<string>> }) {
  const query = useSearchParams().toString()
  useEffect(() => onChange(query), [query, onChange])
  return null
}

/** Only the URL reader suspends; directory content remains in the static HTML. */
export function QueryState({ onChange }: { onChange: Dispatch<SetStateAction<string>> }) {
  return <Suspense fallback={null}><Reader onChange={onChange} /></Suspense>
}
