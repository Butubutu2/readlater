import { NextResponse, type NextRequest } from 'next/server'

const SB_AUTH_COOKIE = 'sb-'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/auth'

  // 仅处理 /auth 已登录时跳首页
  if (isAuthPage) {
    const hasSession = request.cookies.getAll().some((c) => c.name.startsWith(SB_AUTH_COOKIE))
    if (hasSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
