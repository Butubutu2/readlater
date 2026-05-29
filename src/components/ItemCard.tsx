import type { Item } from '@/lib/types'

interface Props {
  item: Item
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

export function ItemCard({ item }: Props) {
  const days = daysAgo(item.saved_at)
  const urgency = urgencyLevel(days)

  return (
    <a
      href={`/go?id=${item.id}`}
      className="group relative flex gap-3 rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      {/* 3 天未读色条 */}
      {item.status === 'unread' && urgency.level > 0 && (
        <div
          className={`absolute left-0 top-2 h-8 w-1 rounded-r ${urgency.color}`}
        />
      )}

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
          {item.status === 'read' && (
            <span className="text-gray-300">· 已读</span>
          )}
        </div>
      </div>
    </a>
  )
}
