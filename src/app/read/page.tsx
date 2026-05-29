'use client'

import { useEffect, useState } from 'react'
import { ItemCard } from '@/components/ItemCard'
import { EmptyState } from '@/components/EmptyState'
import type { Item, PaginatedResponse } from '@/lib/types'

export default function ReadPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  async function fetchItems(cursorVal?: string) {
    const params = new URLSearchParams({ status: 'read', limit: '20' })
    if (cursorVal) params.set('cursor', cursorVal)

    const res = await fetch(`/api/items?${params}`)
    if (!res.ok) return

    const data: PaginatedResponse<Item> = await res.json()

    if (cursorVal) {
      setItems((prev) => [...prev, ...data.items])
    } else {
      setItems(data.items)
    }

    setCursor(data.next_cursor)
    setHasMore(data.has_more)
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  function loadMore() {
    if (cursor && !loadingMore) {
      setLoadingMore(true)
      fetchItems(cursor)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-20 pt-4">
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center justify-between">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回
        </a>
        <h1 className="text-lg font-bold text-gray-900">已读</h1>
        <div className="w-8" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-400">加载中…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="还没有已读内容"
          description="点击主页的卡片标记已读"
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
