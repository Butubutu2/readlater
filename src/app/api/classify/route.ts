import { NextRequest, NextResponse } from 'next/server'
import { classifyWithGLM } from '@/lib/glm'

// ============================================================
// 频率限制：匿名用户每小时最多 20 次
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_ANONYMOUS = 20

function getRateLimitInfo(ip: string): { count: number; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 0, resetAt: now + 3600000 })
    return { count: 0, remaining: MAX_ANONYMOUS, resetAt: now + 3600000 }
  }
  return { count: entry.count, remaining: Math.max(0, MAX_ANONYMOUS - entry.count), resetAt: entry.resetAt }
}

export async function POST(request: NextRequest) {
  const { createServerSupabase } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { title, cover_url } = body as { title: string; cover_url?: string }

  if (!title) {
    return NextResponse.json({ error: '缺少标题' }, { status: 400 })
  }

  // 匿名用户检查频率限制
  if (!user) {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { count, remaining } = getRateLimitInfo(ip)

    if (count >= MAX_ANONYMOUS) {
      return NextResponse.json(
        { error: '访问频繁', code: 'RATE_LIMITED', message: '匿名用户每小时限制 20 次调用，请登录后继续使用' },
        { status: 429 }
      )
    }
    rateLimitMap.set(ip, { count: count + 1, resetAt: Date.now() + 3600000 })
  }

  // 获取标签列表
  if (user) {
    const { data: tags } = await supabase.from('tags').select('name').eq('user_id', user.id)
    const existingTags = tags?.map((t) => t.name) ?? []
    try {
      const result = await classifyWithGLM(title, cover_url ?? null, existingTags)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ tag: '未分类', summary: '', confidence: 0 })
    }
  }

  // 匿名用户：提供空标签列表
  try {
    const result = await classifyWithGLM(title, cover_url ?? null, [])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ tag: '未分类', summary: '', confidence: 0 })
  }
}
