import type { Item, Tag, Platform, ItemStatus } from './types'
import {
  addLocalItem,
  deleteLocalItem,
  markLocalRead,
  markLocalUnread,
  queryLocalItems,
  getLocalItems,
  getLocalUnreadItems,
  clearLocalData,
  isLocalDuplicate,
} from './local-db'

// ============================================================
// 统一数据层
// 判断登录态，自动切换 localStorage / API
// ============================================================

// ----- 判断登录态 -----

export function getIsLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('readlater_logged_in') === 'true'
}

export function setLoggedInFlag(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('readlater_logged_in', 'true')
}

export function clearLoggedInFlag(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('readlater_logged_in')
}

// ----- 查询 -----

export async function fetchItems(params: {
  status?: ItemStatus
  tag?: string
  platform?: Platform
  q?: string
  limit?: number
  cursor?: string
}): Promise<{ items: Item[]; tags: Tag[]; next_cursor: string | null; has_more: boolean }> {
  if (getIsLoggedIn()) {
    const searchParams = new URLSearchParams()
    if (params.status) searchParams.set('status', params.status)
    if (params.tag) searchParams.set('tag', params.tag)
    if (params.platform) searchParams.set('platform', params.platform)
    if (params.q) searchParams.set('q', params.q)
    searchParams.set('limit', String(params.limit ?? 20))
    if (params.cursor) searchParams.set('cursor', params.cursor)

    try {
      const res = await fetch(`/api/items?${searchParams}`)
      if (res.ok) return await res.json()
    } catch {
      // API 失败，降级到本地
    }
  }
  return queryLocalItems(params)
}

// ----- 添加 -----

export async function addItem(data: {
  original_url: string
  normalized_url: string
  title: string
  cover_url: string | null
  platform: Platform
  tag: string
  ai_summary: string | null
}): Promise<Item> {
  if (getIsLoggedIn()) {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.original_url,
          tag: data.tag,
          title: data.title,
          cover_url: data.cover_url,
          ai_summary: data.ai_summary,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        return json.item
      }
      if (res.status === 409) {
        const json = await res.json()
        if (json.existing_item) {
          return json.existing_item as Item
        }
      }
    } catch {
      // 降级到本地
    }
  }
  return addLocalItem(data)
}

// ----- 删除 -----

export async function deleteItem(id: string): Promise<void> {
  if (getIsLoggedIn() && !id.startsWith('local_')) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
  } else {
    deleteLocalItem(id)
  }
}

// ----- 标记已读 -----

export async function markRead(id: string): Promise<void> {
  if (getIsLoggedIn() && !id.startsWith('local_')) {
    await fetch(`/api/items/${id}/read`, { method: 'POST' })
  } else {
    markLocalRead(id)
  }
}

// ----- 标记未读 -----

export async function markUnread(id: string): Promise<void> {
  if (getIsLoggedIn() && !id.startsWith('local_')) {
    await fetch(`/api/items/${id}/unread`, { method: 'POST' })
  } else {
    markLocalUnread(id)
  }
}

// ----- 同步 -----

export async function syncToCloud(
  onProgress?: (current: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const localItems = getLocalItems()
  let synced = 0
  let failed = 0

  for (let i = 0; i < localItems.length; i++) {
    const item = localItems[i]
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.original_url,
          tag: item.tag,
          title: item.title,
          cover_url: item.cover_url,
          ai_summary: item.ai_summary,
        }),
      })
      if (res.ok) {
        synced++
      } else {
        const json = await res.json()
        if (json.error === 'duplicate') {
          synced++
        } else {
          failed++
        }
      }
    } catch {
      failed++
    }
    onProgress?.(i + 1, localItems.length)
  }

  return { synced, failed }
}

export async function hasCloudData(): Promise<boolean> {
  try {
    const res = await fetch('/api/items?limit=1')
    if (!res.ok) return false
    const json = await res.json()
    return json.items && json.items.length > 0
  } catch {
    return false
  }
}

// ----- 清理 -----

export function clearAllLocalData(): void {
  clearLocalData()
}

export { getLocalItems, getLocalUnreadItems, isLocalDuplicate }
