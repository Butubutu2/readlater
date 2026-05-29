import type { Platform } from './types'

// ============================================================
// URL 规范化 — 用于去重
// ============================================================

/** 识别平台 */
export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase()
  if (u.includes('mp.weixin.qq.com')) return 'wechat'
  if (u.includes('bilibili.com') || u.includes('b23.tv')) return 'bilibili'
  if (u.includes('douyin.com')) return 'douyin'
  return 'other'
}

/** 微信公众号规范化 — 保留 `/s/{id}`，去除所有查询参数 */
function normalizeWechat(url: string): string {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/s\/[^/]+/)
    if (match) {
      return `https://mp.weixin.qq.com${match[0]}`
    }
    // fallback: 保留整个 pathname，只去 query
    return `https://mp.weixin.qq.com${u.pathname}`
  } catch {
    return url
  }
}

/** B 站规范化 — 保留 `/video/{BV号}`，去除分 P 参数 */
function normalizeBilibili(url: string): string {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/video\/(BV[a-zA-Z0-9]+)/)
    if (match) {
      return `https://www.bilibili.com/video/${match[1]}`
    }
    // b23.tv 短链 — 需要先获取真实 URL（这里只做基础提取）
    if (url.includes('b23.tv')) {
      return url // 保留，调用方会进一步解析
    }
    return `https://www.bilibili.com${u.pathname}`
  } catch {
    return url
  }
}

/** 抖音规范化 — 从短链提取视频标识符，零 HTTP 请求 */
function normalizeDouyin(url: string): string {
  try {
    const u = new URL(url)
    // 匹配 v.douyin.com/iABCDEF/ 或 v.douyin.com/iABCDEF 格式
    const match = u.pathname.match(/^\/([a-zA-Z0-9_-]+)/)
    if (match) {
      return `douyin://video/${match[1]}`
    }
    return url
  } catch {
    return url
  }
}

/** 通用规范化 — HTTPS，统一域名，去除追踪参数 */
function normalizeGeneric(url: string): string {
  try {
    const u = new URL(url)
    // 强制 HTTPS
    u.protocol = 'https:'
    // 统一域名（去除/添加 www）
    const host = u.hostname.replace(/^www\./, '')
    u.hostname = host.startsWith('www.') ? host : `www.${host}`
    // 去除常见追踪参数
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ref', 'source', 'from',
    ]
    trackingParams.forEach((p) => u.searchParams.delete(p))
    // 如果 search 为空则去掉 ?
    const result = u.toString()
    return result.replace(/\?$/, '')
  } catch {
    return url
  }
}

/**
 * URL 规范化主入口
 * 返回规范化后的 URL（用于去重）+ 识别到的平台
 */
export function normalizeUrl(url: string): { normalizedUrl: string; platform: Platform } {
  const trimmed = url.trim()
  const platform = detectPlatform(trimmed)

  let normalized: string
  switch (platform) {
    case 'wechat':
      normalized = normalizeWechat(trimmed)
      break
    case 'bilibili':
      normalized = normalizeBilibili(trimmed)
      break
    case 'douyin':
      normalized = normalizeDouyin(trimmed)
      break
    default:
      normalized = normalizeGeneric(trimmed)
  }

  return { normalizedUrl: normalized, platform }
}
