import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'edge'

// ============================================================
// POST /api/items/:id/read — 标记已读
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = await params

  // 校验归属
  const { data: item, error: findError } = await supabase
    .from('items')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (findError || !item) {
    return NextResponse.json({ error: '内容不存在' }, { status: 404 })
  }

  if (item.user_id !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  // 标记已读（幂等）
  const { error: updateError } = await supabase
    .from('items')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
