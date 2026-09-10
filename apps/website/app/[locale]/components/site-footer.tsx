'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa6'
import Image from 'next/image'
import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import { site } from '@/lib/site'

// Same background as the topbar — one dark shade across both chrome bars
const socials = [
  { href: site.social.facebook, label: 'Facebook', Icon: FaFacebookF },
  { href: site.social.instagram, label: 'Instagram', Icon: FaInstagram },
  { href: site.social.linkedin, label: 'LinkedIn', Icon: FaLinkedinIn },
  { href: site.social.youtube, label: 'YouTube', Icon: FaYoutube },
]

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const homeHref = `/${locale}`
  const ar_ = locale === 'ar'
  const year = new Date().getFullYear()

  const links = [
    { href: homeHref, label: t.nav.home },
    { href: `${homeHref}/departments`, label: t.nav.departments },
    { href: `${homeHref}/doctors`, label: t.nav.doctors },
    { href: `${homeHref}/insurance`, label: t.insurance.title },
    { href: `${homeHref}/contact`, label: t.nav.contact },
    { href: `${homeHref}/privacy`, label: ar_ ? 'سياسة الخصوصية' : 'Privacy' },
    { href: `${homeHref}/appointment-policy`, label: ar_ ? 'سياسة المواعيد' : 'Appointment policy' },
  ]

  return (
    <footer className="bg-neutral-800 text-neutral-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand: logo, about, socials */}
        <div className="space-y-5">
          <Link href={homeHref} className="flex items-center" aria-label={t.siteName}>
            <Image
              src="/abc-logo.webp"
              alt={t.siteName}
              width={64}
              height={64}
              style={{ width: 'auto', height: '3.5rem' }}
            />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-neutral-400">{t.footer.about}</p>
          <div className="flex items-center gap-1" >
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-md p-2 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4" />
              </a>
            ))}
            <a
              href={`https://wa.me/${site.whatsapp.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="rounded-md p-2 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FaWhatsapp className="size-4" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-white">
            {t.footer.quickLinks}
          </h3>
          <ul className="space-y-2.5">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact: address + email */}
        <div>
          <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-white">
            {t.footer.contact}
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              <div>
                <p className="text-xs font-semibold text-neutral-500">{t.footer.address}</p>
                <p className="text-sm">{site.address[locale]}</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 shrink-0 text-brand" />
              <a
                href={`mailto:${site.email}`}
                className="text-sm break-all transition-colors hover:text-white"
                dir="ltr"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Hotline: its own visual block */}
        <div className="flex flex-col items-start gap-3 sm:items-center lg:items-center">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-white">
            {t.footer.hotline}
          </h3>
          <a href={`tel:${site.hotline}`} dir="ltr" className="group flex flex-col items-center gap-1">
            <span className="flex items-center gap-3">
              <span className="text-5xl font-bold text-brand tracking-widest ">
                {site.hotline}
              </span>
            </span>
            <span className="text-xs text-neutral-500">{t.actions.call}</span>
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-neutral-500">
          © {year} {t.siteName} — {t.footer.rights}
        </p>
      </div>
    </footer>
  )
}
