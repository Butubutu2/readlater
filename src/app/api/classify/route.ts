import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'edge'
import { classifyWithGLM } from '@/lib/glm'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { title, cover_url } = body as { title: string; cover_url?: string }

  if (!title) {
    return NextResponse.json({ error: '缺少标题' }, { status: 400 })
  }

  // 获取用户已有标签列表
  const { data: tags } = await supabase
    .from('tags')
    .select('name')
    .eq('user_id', user.id)

  const existingTags = tags?.map((t) => t.name) ?? []

  try {
    const result = await classifyWithGLM(title, cover_url ?? null, existingTags)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI 分类失败:', error)
    // 降级返回
    return NextResponse.json({
      tag: '未分类',
      summary: '',
      confidence: 0,
    })
  }
}
