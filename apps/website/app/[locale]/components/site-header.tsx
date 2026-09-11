'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Menu, Phone, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { locales, type Dictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'
import { EmergencyButton } from './emergency-button'
import {
  DropdownMenu,
  DropdownMenuCheck,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

type Props = { locale: Locale; t: Dictionary }

export function SiteHeader({ locale, t }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const homeHref = `/${locale}`

  const links = [
    { href: homeHref, label: t.nav.home, exact: true },
    { href: `${homeHref}/departments`, label: t.nav.departments },
    { href: `${homeHref}/doctors`, label: t.nav.doctors },
    { href: `${homeHref}/about`, label: locale === 'ar' ? 'من نحن' : 'About' },
    { href: `${homeHref}/blog`, label: locale === 'ar' ? 'المدونة' : 'Blog' },
    { href: `${homeHref}/news`, label: t.nav.news },
    { href: `${homeHref}/contact`, label: t.nav.contact },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  // Close the menu whenever the route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // While open: close on Escape and on user scroll gestures.
  // Deliberately wheel/touchmove (not 'scroll') — the menu's own height
  // animation emits scroll events that would instantly close it.
  useEffect(() => {
    if (!open) return

    const close = () => setOpen(false)
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 2) close()
    }
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchmove', close, { passive: true })
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', close)
      window.removeEventListener('keydown', onKeydown)
    }
  }, [open])

  const localeSwitch = (l: string) => {
    const segments = (pathname || `/${locale}`).split('/')
    segments[1] = l
    window.location.assign(segments.join('/') || `/${l}`)
  }

  return (
    <>
      {/* Backdrop: closes the mobile menu on any outside tap */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label={t.header.close}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
          {/* Logo */}
          <Link prefetch={true} href={homeHref} className="flex items-center" aria-label={t.siteName}>
            <Image
              src="/abc-logo.webp"
              alt={t.siteName}
              width={64}
              height={64}
              style={{ width: 'auto', height: '3rem' }}
              priority
            />
          </Link>

          {/* Centered desktop nav */}
          <nav className="hidden items-center justify-center gap-7 lg:flex">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
                  isActive(item.href, item.exact) && 'text-brand-deep hover:text-brand-deep',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* End side: emergency (desktop) / language + burger (mobile) */}
          <div className="flex items-center justify-end gap-2">
            <div className="hidden lg:flex">
              <EmergencyButton t={t} />
            </div>

            {/* Mobile-only language switch (topbar is desktop-only) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs font-semibold uppercase outline-none transition-colors hover:bg-muted lg:hidden"
                aria-label={t.header.language}
              >
                {locale}
                <ChevronDown className="size-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t.header.language}</DropdownMenuLabel>
                {locales.map((l) => (
                  <DropdownMenuItem key={l} onSelect={() => localeSwitch(l)}>
                    <DropdownMenuCheck checked={l === locale} />
                    {l === 'ar' ? 'العربية' : 'English'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 lg:hidden"
              aria-label={open ? t.header.close : t.header.menu}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden border-t border-border bg-background lg:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                      isActive(item.href, item.exact) && 'bg-muted text-brand-deep',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <EmergencyButton t={t} className="mt-2 justify-center py-2.5" />
                <a
                  href={`tel:${site.hotline}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
                >
                  <Phone className="size-4" />
                  {t.actions.call} — {site.hotline}
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
