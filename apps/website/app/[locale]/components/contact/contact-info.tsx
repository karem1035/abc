'use client'

import { Mail, MapPin } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa6'
import type { Dictionary, Locale } from '@/lib/i18n'
import { site } from '@/lib/site'

const socials = [
  { href: site.social.facebook, label: 'Facebook', Icon: FaFacebookF },
  { href: site.social.instagram, label: 'Instagram', Icon: FaInstagram },
  { href: site.social.linkedin, label: 'LinkedIn', Icon: FaLinkedinIn },
  { href: site.social.youtube, label: 'YouTube', Icon: FaYoutube },
]

/** Side column under the contact form: email, location, socials. */
export function ContactInfo({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <div className="contact-details">


      {/* Email */}
      <a href={`mailto:${site.email}`} className="contact-detail-row">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
          <Mail className="size-4" />
        </span>
        <span>
          <span className="block text-xs text-muted-foreground">{t.footer.contact}</span>
          <span className="text-sm font-semibold" dir="ltr">{site.email}</span>
        </span>
      </a>

      {/* Address */}
      <div className="contact-detail-row">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
          <MapPin className="size-4" />
        </span>
        <span>
          <span className="block text-xs text-muted-foreground">{t.footer.address}</span>
          <span className="text-sm font-semibold">{site.address[locale]}</span>
        </span>
      </div>

      {/* Socials */}
      <div className="contact-socials" dir="ltr">
        {socials.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-deep"
          >
            <Icon className="size-4" />
          </a>
        ))}
        <a
          href={`https://wa.me/${site.whatsapp.replace('+', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-deep"
        >
          <FaWhatsapp className="size-4" />
        </a>
      </div>
    </div>
  )
}
