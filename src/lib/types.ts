// ============================================================
// ReadLater 类型定义
// ============================================================

/** 平台标识 */
export type Platform = 'wechat' | 'bilibili' | 'douyin' | 'other'

/** 内容状态 */
export type ItemStatus = 'unread' | 'read'

/** 收藏内容 */
export interface Item {
  id: string
  user_id: string
  original_url: string
  normalized_url: string
  title: string
  cover_url: string | null
  platform: Platform
  tag: string
  ai_summary: string | null
  status: ItemStatus
  is_broken: boolean
  saved_at: string
  read_at: string | null
}

/** 标签 */
export interface Tag {
  id: string
  user_id: string
  name: string
  created_at: string
}

/** AI 分类结果 */
export interface ClassificationResult {
  tag: string
  summary: string
  confidence: number
}

/** 链接解析结果 */
export interface ParseResult {
  title: string
  cover_url: string | null
  platform: Platform
  normalized_url: string
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  tags: Tag[]
  next_cursor: string | null
  has_more: boolean
}

/** 翻页参数 */
export interface CursorParams {
  limit?: number
  cursor?: string
  status?: ItemStatus
  tag?: string
  platform?: Platform
  q?: string
}

/** 创建 item 请求 */
export interface CreateItemRequest {
  url: string
  tag?: string
}

/** 创建 item 响应 */
export type CreateItemResponse =
  | { item: Item }
  | { error: 'duplicate'; existing_item: Item }
