'use client'

import { useEffect, useState, useCallback } from 'react'
import { ItemCard } from '@/components/ItemCard'
import { EmptyState } from '@/components/EmptyState'
import { Header } from '@/components/Header'
import { fetchItems, deleteItem, markUnread } from '@/lib/data-layer'
import type { Item } from '@/lib/types'

export default function ReadPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadItems = useCallback(async (cursorVal?: string) => {
    const data = await fetchItems({ status: 'read', limit: 20, cursor: cursorVal ?? undefined })

    if (cursorVal) {
      setItems((prev) => [...prev, ...data.items])
    } else {
      setItems(data.items)
    }

    setCursor(data.next_cursor)
    setHasMore(data.has_more)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  function loadMore() {
    if (cursor && !loadingMore) {
      setLoadingMore(true)
      loadItems(cursor)
    }
  }

  async function handleMarkUnread(id: string) {
    await markUnread(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleDelete(id: string) {
    await deleteItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-20 pt-4">
      <Header />

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
              <ItemCard
                key={item.id}
                item={item}
                showActions
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
              />
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
