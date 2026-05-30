'use client'

import { useState } from 'react'
import type { Item } from '@/lib/types'
import { markLocalRead } from '@/lib/local-db'

interface Props {
  item: Item
  showActions?: boolean
  onMarkUnread?: (id: string) => void
  onDelete?: (id: string) => void
}

/** 计算收藏至今的天数 */
function daysAgo(savedAt: string): number {
  const now = Date.now()
  const saved = new Date(savedAt).getTime()
  return Math.floor((now - saved) / (1000 * 60 * 60 * 24))
}

/** 3 天未读提醒的醒目程度 */
function urgencyLevel(days: number): { level: number; color: string } {
  if (days >= 14) return { level: 3, color: 'bg-red-500' }
  if (days >= 7) return { level: 2, color: 'bg-orange-500' }
  if (days >= 3) return { level: 1, color: 'bg-amber-400' }
  return { level: 0, color: '' }
}

const platformIcons: Record<string, string> = {
  wechat: '💬',
  bilibili: '📺',
  douyin: '🎵',
  other: '🔗',
}

export function ItemCard({ item, showActions, onMarkUnread, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const days = daysAgo(item.saved_at)
  const urgency = urgencyLevel(days)

  return (
    <div className="group relative rounded-lg bg-white shadow-sm transition hover:shadow-md">
      {/* 3 天未读色条 */}
      {item.status === 'unread' && urgency.level > 0 && (
        <div
          className={`absolute left-0 top-2 z-10 h-8 w-1 rounded-r ${urgency.color}`}
        />
      )}

      {/* 操作菜单（右上角三个点） */}
      {showActions && (
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {item.status === 'read' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onMarkUnread?.(item.id)
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    标记未读
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    if (window.confirm('确定删除这条收藏？')) {
                      onDelete?.(item.id)
                    }
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 卡片主体 — 点击跳转 */}
      <a
        href={item.id.startsWith('local_') ? item.original_url : `/go?id=${item.id}`}
        onClick={
          item.id.startsWith('local_')
            ? () => markLocalRead(item.id)
            : undefined
        }
        className="flex gap-3 p-4"
      >
        {/* 封面图 */}
        {item.cover_url && (
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            <img
              src={item.cover_url}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}

        {/* 内容 */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-gray-700">
            {item.title}
          </h3>
          {item.ai_summary && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {item.ai_summary}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <span>{platformIcons[item.platform] || '🔗'}</span>
            <span>{days === 0 ? '今天' : `${days}天前`}</span>
            <span className="text-gray-300">· {item.tag}</span>
          </div>
        </div>
      </a>
    </div>
  )
}
