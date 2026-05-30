'use client'

import { useState, useEffect } from 'react'
import { getIsLoggedIn } from '@/lib/data-layer'

interface Props {
  url: string
  title: string
  cover_url: string | null
  platform: string
  normalized_url: string
  onConfirm: (tag: string) => void
  onCancel: () => void
}

export function CategoryConfirm({
  url,
  title,
  cover_url,
  platform,
  normalized_url,
  onConfirm,
  onCancel,
}: Props) {
  const [classification, setClassification] = useState<{
    tag: string
    summary: string
    confidence: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState('')
  const [rateLimited, setRateLimited] = useState(false)
  const [rateLimitMsg, setRateLimitMsg] = useState('')

  const loggedIn = getIsLoggedIn()

  useEffect(() => {
    async function classify() {
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, cover_url }),
        })

        if (res.status === 429) {
          const data = await res.json()
          setRateLimited(true)
          setRateLimitMsg(data.message || '调用次数已达上限')
          setClassification({ tag: '未分类', summary: '', confidence: 0 })
          setSelectedTag('未分类')
          setLoading(false)
          return
        }

        const data = await res.json()
        setClassification(data)
        setSelectedTag(data.confidence >= 0.6 ? data.tag : '未分类')
      } catch {
        setClassification({ tag: '未分类', summary: '', confidence: 0 })
        setSelectedTag('未分类')
      }
      setLoading(false)
    }
    classify()
  }, [title, cover_url])

  function handleSave() {
    onConfirm(selectedTag)
  }

  const platformNames: Record<string, string> = {
    wechat: '微信公众号',
    bilibili: 'B 站',
    douyin: '抖音',
    other: '其他',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-2 font-medium text-gray-900">{title}</h3>
        <p className="mb-4 text-xs text-gray-500">
          {platformNames[platform] || '其他'} · 来源链接
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">AI 正在分析内容…</p>
        ) : rateLimited ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ {rateLimitMsg}
            </div>
            <p className="text-sm text-gray-500">
              登录后即可不限次数使用 AI 分类功能。
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <a
                href="/auth"
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
              >
                去登录
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {classification?.summary && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {classification.summary}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500">标签</label>
              <input
                type="text"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="输入标签名称"
              />
              {classification && !rateLimited && classification.confidence < 0.6 && (
                <p className="mt-1 text-xs text-amber-600">
                  AI 建议：{classification.tag}（置信度较低，已设为&ldquo;未分类&rdquo;）
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                保存
              </button>
            </div>

            {!loggedIn && (
              <p className="text-center text-xs text-gray-400">
                内容保存在本地 · <a href="/auth" className="text-blue-500 hover:underline">登录</a>可同步到云端
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
