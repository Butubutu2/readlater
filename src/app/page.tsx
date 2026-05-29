'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { LinkInput } from '@/components/LinkInput'
import { TagSection } from '@/components/TagSection'
import { CategoryConfirm } from '@/components/CategoryConfirm'
import { EmptyState } from '@/components/EmptyState'
import type { Item, PaginatedResponse } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingUrl, setPendingUrl] = useState<{
    url: string
    title: string
    cover_url: string | null
    platform: string
    normalized_url: string
  } | null>(null)

  // 检查登录状态
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth')
      }
    })
  }, [router])

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items?status=unread&limit=100')
      if (res.ok) {
        const data: PaginatedResponse<Item> = await res.json()
        setItems(data.items)
        setTags(data.tags.map((t) => t.name))
      }
    } catch {
      // 静默失败
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // 按标签分组
  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const t = item.tag || '未分类'
    if (!acc[t]) acc[t] = []
    acc[t].push(item)
    return acc
  }, {})

  // 排序：按组内最早收藏时间的倒序
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
    setPendingUrl(data)
  }

  async function handleConfirm(_tag: string) {
    setPendingUrl(null)
    await fetchItems()
  }

  function handleCancel() {
    setPendingUrl(null)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-center text-sm text-gray-400">加载中…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-20 pt-4">
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">ReadLater</h1>
        <div className="flex items-center gap-3">
          <a href="/search" className="text-sm text-gray-500 hover:text-gray-700">
            搜索
          </a>
          <a href="/read" className="text-sm text-gray-500 hover:text-gray-700">
            已读
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            退出
          </button>
        </div>
      </div>

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
