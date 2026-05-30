'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LinkInput } from '@/components/LinkInput'
import { TagSection } from '@/components/TagSection'
import { CategoryConfirm } from '@/components/CategoryConfirm'
import { EmptyState } from '@/components/EmptyState'
import { Header } from '@/components/Header'
import { fetchItems, addItem, deleteItem, getIsLoggedIn } from '@/lib/data-layer'
import { normalizeUrl } from '@/lib/normalize-url'
import { isLocalDuplicate } from '@/lib/local-db'
import type { Item, PaginatedResponse } from '@/lib/types'

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingUrl, setPendingUrl] = useState<{
    url: string
    title: string
    cover_url: string | null
    platform: string
    normalized_url: string
  } | null>(null)

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchItems({ status: 'unread', limit: 200 })
      setItems(data.items)
    } catch {
      // 静默失败
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // 按标签分组
  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const t = item.tag || '未分类'
    if (!acc[t]) acc[t] = []
    acc[t].push(item)
    return acc
  }, {})

  // 排序：按最早收藏时间倒序
  const sortedTags = Object.keys(grouped).sort((a, b) => {
    const aTime = Math.min(...grouped[a].map((i) => new Date(i.saved_at).getTime()))
    const bTime = Math.min(...grouped[b].map((i) => new Date(i.saved_at).getTime()))
    return bTime - aTime
  })

  async function handleParsed(data: {
    url: string
    title: string
    cover_url: string | null
    platform: string
    normalized_url: string
  }) {
    // 本地去重
    if (!getIsLoggedIn() && isLocalDuplicate(data.normalized_url)) {
      alert('该内容已收藏')
      return
    }
    setPendingUrl(data)
  }

  async function handleConfirm(tag: string, aiSummary?: string | null) {
    setPendingUrl(null)
    if (!pendingUrl) return

    await addItem({
      original_url: pendingUrl.url,
      normalized_url: pendingUrl.normalized_url,
      title: pendingUrl.title,
      cover_url: pendingUrl.cover_url,
      platform: pendingUrl.platform as Item['platform'],
      tag: tag || '未分类',
      ai_summary: aiSummary ?? null,
    })
    await loadItems()
  }

  function handleCancel() {
    setPendingUrl(null)
  }

  async function handleDelete(id: string) {
    await deleteItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <Header />
        <p className="text-center text-sm text-gray-400">加载中…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-20 pt-4">
      <Header />

      {/* 录入模块 */}
      <div className="relative mb-8">
        <LinkInput onParsed={handleParsed} />
      </div>

      {/* 内容区 */}
      {items.length === 0 ? (
        <EmptyState
          title="还没有收藏内容"
          description="粘贴一个链接开始，AI 会自动分类整理"
        />
      ) : (
        <div className="space-y-8">
          {sortedTags.map((tag) => (
            <TagSection key={tag} tag={tag} items={grouped[tag]} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* 分类确认弹窗 */}
      {pendingUrl && (
        <CategoryConfirm
          url={pendingUrl.url}
          title={pendingUrl.title}
          cover_url={pendingUrl.cover_url}
          platform={pendingUrl.platform}
          normalized_url={pendingUrl.normalized_url}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </main>
  )
}
