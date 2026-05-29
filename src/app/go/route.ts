import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// ============================================================
// GET /go?id=xxx — 标记已读 + 302 重定向到原文
// ============================================================
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 未登录跳转登录页
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 })
  }

  // 获取内容 + 校验归属
  const { data: item, error } = await supabase
    .from('items')
    .select('id, user_id, original_url, status')
    .eq('id', id)
    .single()

  if (error || !item) {
    return NextResponse.json({ error: '内容不存在' }, { status: 404 })
  }

  if (item.user_id !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  // 标记已读（幂等）
  if (item.status === 'unread') {
    await supabase
      .from('items')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', id)
  }

  // 302 重定向到原文
  return NextResponse.redirect(item.original_url)
}
