'use client'

import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa6'
import { site } from '@/lib/site'

export function WhatsappButton({ label }: { label: string }) {
  return (
    <motion.a
      href={`https://wa.me/${site.whatsapp.replace('+', '')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-5 z-50 flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 ltr:right-5 rtl:left-5"
    >
      <FaWhatsapp className="size-7" />
      <span className="absolute inline-flex h-full w-full -z-10 animate-ping rounded-full bg-[#25D366] opacity-25" />
    </motion.a>
  )
}
