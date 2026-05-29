'use client'

import { useState, FormEvent } from 'react'

interface Props {
  onParsed: (data: {
    url: string
    title: string
    cover_url: string | null
    platform: string
    normalized_url: string
  }) => void
}

export function LinkInput({ onParsed }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      // 1. 解析链接
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      if (parseRes.status === 409) {
        const data = await parseRes.json()
        setError('该内容已收藏')
        setLoading(false)
        return
      }

      if (!parseRes.ok) {
        const data = await parseRes.json()
        setError(data.error || '解析失败')
        setLoading(false)
        return
      }

      const parseData = await parseRes.json()
      onParsed({ ...parseData, url: trimmed })
      setUrl('')
    } catch {
      setError('网络错误，请重试')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="url"
        placeholder="粘贴链接…"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setError('')
        }}
        required
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? '…' : '保存'}
      </button>
      {error && (
        <p className="absolute mt-10 text-sm text-red-500">{error}</p>
      )}
    </form>
  )
}
