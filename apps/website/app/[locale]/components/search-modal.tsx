'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Dictionary } from '@/lib/i18n'

type Result = {
  id: string
  title: string
  type: string
  preview: string
}

// Placeholder data until doctors/departments/news APIs are wired in
const sampleResults: Result[] = [
  { id: 'd1', title: 'د. أحمد محمد — قلب وأوعية دموية', type: 'طبيب', preview: 'استشاري أمراض القلب — خبرة 15 عامًا في القسطرة والتدخلالجاراحي.' },
  { id: 'd2', title: 'قسم العظام والمفاصل', type: 'قسم', preview: 'جراحات استبدال المفاصل، مناظير العظام، وإصابات الملاعب.' },
  { id: 'd3', title: 'د. سارة علي — جلدية وتجميل', type: 'طبيب', preview: 'علاج أمراض الجلد، الليزر، والحقن التجميلي.' },
  { id: 'd4', title: 'طرق الوقاية من أمراض القلب', type: 'مقال', preview: 'نصائح يومية للحفاظ على صحة القلب والشرايين.' },
  { id: 'e1', title: 'Dr. Ahmed Mohamed — Cardiology', type: 'Doctor', preview: 'Consultant interventional cardiologist with 15 years of experience.' },
  { id: 'e2', title: 'Orthopedics Department', type: 'Department', preview: 'Joint replacement, arthroscopy, and sports injuries.' },
  { id: 'e3', title: 'Preventing Heart Disease', type: 'Article', preview: 'Daily habits for a healthy heart.' },
]

type Props = {
  open: boolean
  onClose: () => void
  locale: 'ar' | 'en'
  t: Dictionary
}

export function SearchModal({ open, onClose, locale, t }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(null)
      // focus the input after the open animation starts
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [open, onClose])

  // Placeholder matching — replace with real search API later
  const isAr = locale === 'ar'
  const pool = isAr ? sampleResults.filter((r) => !r.id.startsWith('e')) : sampleResults.filter((r) => r.id.startsWith('e'))
  const results = query.trim()
    ? pool.filter((r) => r.title.includes(query.trim()) || r.preview.includes(query.trim()))
    : pool

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[10vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
            aria-label={t.header.search}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelected(null)
                }}
                placeholder={t.header.searchPlaceholder}
                className="h-13 w-full bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t.header.close}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body: results list or selected preview */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {selected ? (
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <BackIcon className="size-4" />
                    {t.header.search}
                  </button>
                  <span className="inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-deep">
                    {selected.type}
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-bold">{selected.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.preview}</p>
                  {/* Real link/action lands here once modules exist */}
                </div>
              ) : (
                <>
                  {!query.trim() && (
                    <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">{t.header.searchHint}</p>
                  )}
                  {results.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t.header.searchNoResults}
                    </p>
                  )}
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-muted"
                    >
                      <span className="flex items-center gap-3">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-semibold">{r.title}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {r.type}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
