import { NextResponse, type NextRequest } from 'next/server'

// Supabase session cookie 前缀
const SB_AUTH_COOKIE = 'sb-'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 保护需要登录的路由
  const protectedPaths = ['/', '/read', '/search', '/go']
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '?') || pathname.startsWith(p + '/')
  )
  const isAuthPage = pathname === '/auth'

  // 检查 Supabase session cookie 是否存在（不发网络请求）
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith(SB_AUTH_COOKIE))

  if (!hasSession && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
