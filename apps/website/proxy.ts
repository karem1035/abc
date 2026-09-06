import { NextRequest, NextResponse } from 'next/server'
import { defaultLocale, isLocale } from '@/lib/i18n'

const PUBLIC_FILE = /\.(.*)$/ // any file with an extension (images, favicon, ...)

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const firstSegment = pathname.split('/')[1]
  if (isLocale(firstSegment)) return NextResponse.next()

  // Default to Arabic; keep the rest of the path
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
