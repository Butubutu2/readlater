'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ItemCard } from '@/components/ItemCard'
import { EmptyState } from '@/components/EmptyState'
import type { Item, PaginatedResponse } from '@/lib/types'

const PLATFORMS = [
  { value: '', label: '全部平台' },
  { value: 'wechat', label: '微信' },
  { value: 'bilibili', label: 'B 站' },
  { value: 'douyin', label: '抖音' },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') || '')
  const [platformFilter, setPlatformFilter] = useState(searchParams.get('platform') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')

  const [items, setItems] = useState<Item[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchItems = useCallback(async (cursorVal?: string, append = false) => {
    setLoading(true)

    const params = new URLSearchParams({ limit: '20' })
    if (query) params.set('q', query)
    if (tagFilter) params.set('tag', tagFilter)
    if (platformFilter) params.set('platform', platformFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (cursorVal) params.set('cursor', cursorVal)

    const res = await fetch(`/api/items?${params}`)
    if (!res.ok) {
      setLoading(false)
      return
    }

    const data: PaginatedResponse<Item> = await res.json()

    if (append) {
      setItems((prev) => [...prev, ...data.items])
    } else {
      setItems(data.items)
      // 提取所有标签
      const uniqueTags = [...new Set(data.items.map((i) => i.tag).filter(Boolean))]
      setAllTags(uniqueTags as string[])
    }

    setCursor(data.next_cursor)
    setHasMore(data.has_more)
    setLoading(false)
  }, [query, tagFilter, platformFilter, statusFilter])

  // URL 变化时重新搜索
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const tag = searchParams.get('tag') || ''
    const platform = searchParams.get('platform') || ''
    const status = searchParams.get('status') || ''

    if (q || tag || platform || status) {
      fetchItems()
    }
  }, [searchParams, fetchItems])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (tagFilter) params.set('tag', tagFilter)
    if (platformFilter) params.set('platform', platformFilter)
    if (statusFilter) params.set('status', statusFilter)

    router.push(`/search?${params.toString()}`)
  }

  function loadMore() {
    if (cursor && !loading) {
      fetchItems(cursor, true)
    }
  }

  const hasFilters = !!(query || tagFilter || platformFilter || statusFilter)

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-20 pt-4">
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center justify-between">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回
        </a>
        <h1 className="text-lg font-bold text-gray-900">搜索</h1>
        <div className="w-8" />
      </div>

      {/* 搜索表单 */}
      <form onSubmit={handleSearch} className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="搜索标题或 AI 总结…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />

        <div className="flex gap-2">
          {/* 标签筛选 */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          >
            <option value="">全部标签</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          {/* 平台筛选 */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          >
            <option value="">全部状态</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          搜索
        </button>
      </form>

      {/* 搜索结果 */}
      {loading && items.length === 0 ? (
        <p className="text-center text-sm text-gray-400">搜索中…</p>
      ) : !hasFilters ? (
        <EmptyState
          title="输入关键词搜索"
          description="支持按标题、AI 总结、标签、平台筛选"
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="没有找到相关内容"
          description="试试其他关键词或筛选条件"
        />
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-400">
            找到 {items.length}{hasMore ? '+' : ''} 条结果
          </p>
          <div className="space-y-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
