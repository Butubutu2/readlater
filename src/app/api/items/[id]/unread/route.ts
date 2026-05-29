import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// ============================================================
// POST /api/items/:id/unread — 标记为未读
// ============================================================
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = await params

  // 校验归属
  const { data: item } = await supabase
    .from('items')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!item) {
    return NextResponse.json({ error: '内容不存在' }, { status: 404 })
  }

  if (item.user_id !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  // 标记为未读（幂等）
  const { error } = await supabase
    .from('items')
    .update({ status: 'unread', read_at: null })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
