'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Safari-style smooth scrolling (Lenis) — momentum-eased wheel scrolling
 * with a gentle spring, applied site-wide.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 0.3,
      easing: (t: number) => 1 - Math.pow(1 - t, 2), // subtle ease-out
      smoothWheel: true,
      // let dropdown/select menus scroll their own content, not the page
      prevent: (node) =>
        node instanceof HTMLElement &&
        node.closest('[data-lenis-prevent], .select__menu') !== null,
    })

    let frame: number
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
