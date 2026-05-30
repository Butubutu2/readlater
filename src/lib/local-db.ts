import type { Item, Tag, Platform, ItemStatus } from './types'

// ============================================================
// localStorage 数据库
// 匿名用户的数据全部存在浏览器本地
// ============================================================

const ITEMS_KEY = 'readlater_items'
const TAGS_KEY = 'readlater_tags'

/** 生成本地 ID */
function localId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---------- items ----------

export function getLocalItems(): Item[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalItems(items: Item[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
}

/** 添加内容到本地 */
export function addLocalItem(data: {
  original_url: string
  normalized_url: string
  title: string
  cover_url: string | null
  platform: Platform
  tag: string
  ai_summary: string | null
}): Item {
  const items = getLocalItems()
  const now = new Date().toISOString()
  const newItem: Item = {
    id: localId(),
    user_id: '',
    original_url: data.original_url,
    normalized_url: data.normalized_url,
    title: data.title,
    cover_url: data.cover_url,
    platform: data.platform,
    tag: data.tag,
    ai_summary: data.ai_summary,
    status: 'unread',
    is_broken: false,
    saved_at: now,
    read_at: null,
  }
  items.unshift(newItem)
  saveLocalItems(items)
  return newItem
}

/** 删除本地内容 */
export function deleteLocalItem(id: string): void {
  const items = getLocalItems().filter((i) => i.id !== id)
  saveLocalItems(items)
}

/** 标记已读 */
export function markLocalRead(id: string): void {
  const items = getLocalItems()
  const item = items.find((i) => i.id === id)
  if (item) {
    item.status = 'read'
    item.read_at = new Date().toISOString()
    saveLocalItems(items)
  }
}

/** 标记未读 */
export function markLocalUnread(id: string): void {
  const items = getLocalItems()
  const item = items.find((i) => i.id === id)
  if (item) {
    item.status = 'unread'
    item.read_at = null
    saveLocalItems(items)
  }
}

/** 查询本地内容（模拟 API 的筛选和分页） */
export function queryLocalItems(params: {
  status?: ItemStatus
  tag?: string
  platform?: Platform
  q?: string
  limit?: number
  cursor?: string
}): { items: Item[]; tags: Tag[]; next_cursor: string | null; has_more: boolean } {
  let items = getLocalItems()

  // 筛选
  if (params.status) items = items.filter((i) => i.status === params.status)
  if (params.tag) items = items.filter((i) => i.tag === params.tag)
  if (params.platform) items = items.filter((i) => i.platform === params.platform)
  if (params.q) {
    const q = params.q.toLowerCase()
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.ai_summary && i.ai_summary.toLowerCase().includes(q))
    )
  }

  // 按 saved_at 降序
  items.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())

  // 游标分页
  const limit = params.limit ?? 20
  let startIndex = 0
  if (params.cursor) {
    const cursorIndex = items.findIndex((i) => i.saved_at === params.cursor)
    if (cursorIndex >= 0) startIndex = cursorIndex + 1
  }

  const page = items.slice(startIndex, startIndex + limit)
  const hasMore = startIndex + limit < items.length
  const nextCursor = hasMore ? page[page.length - 1]?.saved_at ?? null : null

  // 提取标签
  const tagMap = new Map<string, number>()
  items.forEach((i) => {
    if (i.tag) tagMap.set(i.tag, (tagMap.get(i.tag) || 0) + 1)
  })
  const tags: Tag[] = Array.from(tagMap.entries()).map(([name, count]) => ({
    id: name,
    user_id: '',
    name,
    created_at: '',
  }))

  return { items: page, tags, next_cursor: nextCursor, has_more: hasMore }
}

/** 获取所有未读内容（用于主页） */
export function getLocalUnreadItems(): Item[] {
  return queryLocalItems({ status: 'unread', limit: 200 }).items
}

// ---------- tags ----------

export function getLocalTags(): string[] {
  const items = getLocalItems()
  const tagSet = new Set<string>()
  items.forEach((i) => { if (i.tag) tagSet.add(i.tag) })
  return Array.from(tagSet)
}

// ---------- 同步标记 ----------

/** 获取所有未同步的本地内容 */
export function getUnsyncedLocalItems(): Item[] {
  return getLocalItems()
}

/** 清空所有本地数据 */
export function clearLocalData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ITEMS_KEY)
  localStorage.removeItem(TAGS_KEY)
}

// ---------- 重复检测 ----------

/** 检测本地是否已收藏相同 URL */
export function isLocalDuplicate(normalizedUrl: string): boolean {
  const items = getLocalItems()
  return items.some((i) => i.normalized_url === normalizedUrl)
}
