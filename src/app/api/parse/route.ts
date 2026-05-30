import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'edge'
import { normalizeUrl } from '@/lib/normalize-url'
import { parseMetadata } from '@/lib/parse-metadata'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { url } = body as { url: string }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: '请提供有效的 URL' }, { status: 400 })
  }

  // 1. URL 规范化（同步，无网络请求）
  const { normalizedUrl, platform } = normalizeUrl(url)

  // 2. 去重检测
  const { data: existing } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', user.id)
    .eq('normalized_url', normalizedUrl)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '该内容已收藏', item_id: existing.id }, { status: 409 })
  }

  // 3. 获取元数据（标题+封面）
  try {
    const metadata = await parseMetadata(url)
    return NextResponse.json({
      title: metadata.title,
      cover_url: metadata.cover_url,
      platform,
      normalized_url: normalizedUrl,
    })
  } catch {
    return NextResponse.json({
      title: '未命名内容',
      cover_url: null,
      platform,
      normalized_url: normalizedUrl,
    })
  }
}
