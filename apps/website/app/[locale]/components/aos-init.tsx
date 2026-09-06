'use client'

import AOS from 'aos'
import 'aos/dist/aos.css'
import { useEffect } from 'react'

/** Initializes AOS (animate-on-scroll) once, site-wide. */
export function AosInit() {
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out',
      once: true,
      offset: 60,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
    const onRouteChange = () => AOS.refresh()
    window.addEventListener('popstate', onRouteChange)
    return () => window.removeEventListener('popstate', onRouteChange)
  }, [])
  return null
}
