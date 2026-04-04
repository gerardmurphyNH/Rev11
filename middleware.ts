import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth pages, API routes, and static assets
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const userId = request.cookies.get('rev11_user_id')?.value
  const email = request.cookies.get('rev11_user_email')?.value

  // Has email but no userId → refresh the session cookie then continue
  if (email && !userId) {
    const refreshUrl = new URL(
      `/api/auth/refresh?redirect=${encodeURIComponent(pathname)}`,
      request.url
    )
    return NextResponse.redirect(refreshUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
