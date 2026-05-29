import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { normalizeUrl } from '@/lib/normalize-url'
import { parseMetadata } from '@/lib/parse-metadata'
import { classifyWithGLM } from '@/lib/glm'
import type { Item, CursorParams, PaginatedResponse } from '@/lib/types'

// ============================================================
// GET /api/items — 获取内容列表（cursor-based 分页）
// ============================================================
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const params: CursorParams = {
    limit: Math.min(Number(searchParams.get('limit')) || 20, 100),
    cursor: searchParams.get('cursor') || undefined,
    status: (searchParams.get('status') as CursorParams['status']) || undefined,
    tag: searchParams.get('tag') || undefined,
    platform: searchParams.get('platform') as CursorParams['platform'],
    q: searchParams.get('q') || undefined,
  }

  // 构建查询
  let query = supabase
    .from('items')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  if (params.status) query = query.eq('status', params.status)
  if (params.tag) query = query.eq('tag', params.tag)
  if (params.platform) query = query.eq('platform', params.platform)
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,ai_summary.ilike.%${params.q}%`)
  }

  // cursor-based: saved_at < cursor（按时间降序，越早越靠后）
  if (params.cursor) {
    query = query.lt('saved_at', params.cursor)
  }

  // 多取 1 条来判断 has_more
  query = query
    .order('saved_at', { ascending: false })
    .limit((params.limit ?? 20) + 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = (data ?? []) as Item[]
  const hasMore = items.length > (params.limit ?? 20)
  if (hasMore) items.pop() // 去掉多取的那条

  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].saved_at
    : null

  // 同时返回标签列表（用于筛选）
  const { data: tags } = await supabase
    .from('tags')
    .select('name')
    .eq('user_id', user.id)
    .order('name')

  const response: PaginatedResponse<Item> = {
    items,
    tags: tags?.map((t) => ({ id: t.name, user_id: user.id, name: t.name, created_at: '' })) ?? [],
    next_cursor: nextCursor,
    has_more: hasMore,
  }

  return NextResponse.json(response)
}

// ============================================================
// POST /api/items — 创建新收藏（全流程：解析→分类→保存）
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { url, tag } = body as { url: string; tag?: string }

  if (!url) {
    return NextResponse.json({ error: '请提供 URL' }, { status: 400 })
  }

  // 1. 规范化 URL
  const { normalizedUrl, platform } = normalizeUrl(url)

  // 2. 去重
  const { data: existing } = await supabase
    .from('items')
    .select('id, title, tag, cover_url, platform, saved_at, status, original_url, normalized_url, ai_summary, is_broken, read_at, user_id')
    .eq('user_id', user.id)
    .eq('normalized_url', normalizedUrl)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'duplicate', existing_item: existing },
      { status: 409 }
    )
  }

  // 3. 获取元数据
  let title = '未命名内容'
  let coverUrl: string | null = null
  try {
    const metadata = await parseMetadata(url)
    title = metadata.title
    coverUrl = metadata.cover_url
  } catch {
    // 使用默认值
  }

  // 4. AI 分类（传 tag 则跳过 AI）
  let finalTag = tag || '未分类'
  let aiSummary: string | null = null

  if (!tag) {
    const { data: tags } = await supabase
      .from('tags')
      .select('name')
      .eq('user_id', user.id)
    const existingTags = tags?.map((t) => t.name) ?? []

    try {
      const result = await classifyWithGLM(title, coverUrl, existingTags)
      finalTag = result.tag
      aiSummary = result.summary

      // 如果是新标签，添加到 tags 表
      if (result.tag !== '未分类' && !existingTags.includes(result.tag)) {
        await supabase
          .from('tags')
          .insert({ user_id: user.id, name: result.tag })
          .ignoreDuplicates()
      }
    } catch {
      // AI 失败，保持默认值
    }
  }

  // 5. 保存
  const { data: newItem, error: insertError } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      original_url: url,
      normalized_url: normalizedUrl,
      title,
      cover_url: coverUrl,
      platform,
      tag: finalTag,
      ai_summary: aiSummary,
      status: 'unread',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ item: newItem })
}
