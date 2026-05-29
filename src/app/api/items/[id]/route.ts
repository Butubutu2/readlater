import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// ============================================================
// DELETE /api/items/:id — 删除内容
// ============================================================
export async function DELETE(
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

  const { error } = await supabase.from('items').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
