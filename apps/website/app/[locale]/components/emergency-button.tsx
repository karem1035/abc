'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { PhoneCall } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

/**
 * Red emergency button with a dial icon and a label that smoothly swaps
 * between "طوارئ" (Emergency) and the hotline number (2322) every 2s.
 */
export function EmergencyButton({
  t,
  className,
}: {
  t: Dictionary
  className?: string
}) {
  const [showNumber, setShowNumber] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setShowNumber((v) => !v), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <a
      href={`tel:${site.emergency}`}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg bg-destructive px-5 py-2 text-sm font-bold whitespace-nowrap text-white transition-opacity hover:opacity-90',
        className,
      )}
    >
      <PhoneCall className="size-4 shrink-0" />
      <span className="relative inline-flex h-5 min-w-20 items-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={String(showNumber)}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              showNumber && 'font-extrabold text-xl tracking-widest',
            )}
            dir="ltr"
          >
            {showNumber ? site.emergency : t.header.emergency}
          </motion.span>
        </AnimatePresence>
      </span>
    </a>
  )
}
