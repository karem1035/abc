'use client'

import { Check, ChevronDown, Globe, Search } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa6'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { locales, type Dictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import {
  DropdownMenu,
  DropdownMenuCheck,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { SearchModal } from './search-modal'

const socials = [
  { href: site.social.facebook, label: 'Facebook', Icon: FaFacebookF },
  { href: site.social.instagram, label: 'Instagram', Icon: FaInstagram },
  { href: site.social.linkedin, label: 'LinkedIn', Icon: FaLinkedinIn },
  { href: site.social.youtube, label: 'YouTube', Icon: FaYoutube },
]

export function Topbar({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()

  return (
    // dir="ltr" always — contact info and icons keep one layout in both locales
    <div dir="ltr" className="hidden bg-neutral-800 text-neutral-200 lg:block">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Left: social media */}
        <div className="flex items-center gap-0.5">
          {socials.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="rounded-md p-1.5 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon className="size-3.5" />
            </a>
          ))}
        </div>

        {/* Right: search + language */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10"
            aria-label={t.header.search}
          >
            <Search className="size-3.5" />
            {t.header.search}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase outline-none transition-colors hover:bg-white/10"
              aria-label={t.header.language}
            >
              <Globe className="size-3.5" />
              {locale}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t.header.language}</DropdownMenuLabel>
              {locales.map((l) => (
                <DropdownMenuItem
                  key={l}
                  onSelect={() => {
                    const segments = (pathname || `/${locale}`).split('/')
                    segments[1] = l
                    window.location.assign(segments.join('/') || `/${l}`)
                  }}
                >
                  <DropdownMenuCheck checked={l === locale} />
                  {l === 'ar' ? 'العربية' : 'English'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} t={t} />
    </div>
  )
}
