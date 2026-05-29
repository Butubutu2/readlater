import type { ParseResult, Platform } from './types'
import { detectPlatform } from './normalize-url'

// ============================================================
// 元数据解析 — 从 URL 获取 og:title / og:image
// ============================================================

/** 从 HTML 中提取 og meta 标签值 */
function extractMeta(html: string, property: string): string | null {
  // 匹配 <meta property="og:title" content="..." />
  // 或 <meta name="og:title" content="..." />
  const patterns = [
    new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
    new RegExp(`<meta\\s+[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** 从 HTML 中提取 <title> */
function extractTitle(html: string): string | null {
  const match = html.match(/<title>([^<]*)<\/title>/i)
  return match ? match[1].trim() : null
}

/** 解析页面元数据 */
export async function parseMetadata(url: string): Promise<ParseResult> {
  const platform = detectPlatform(url)

  // 抖音短链不需要 HTTP 请求去规范化，但元数据仍需获取
  // 如果无法获取，降级
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })

    clearTimeout(timeout)

    const html = await response.text()
    const title = extractMeta(html, 'og:title') ?? extractTitle(html) ?? '未命名内容'
    const coverUrl = extractMeta(html, 'og:image')

    return { title, cover_url: coverUrl, platform, normalized_url: url }
  } catch {
    // 降级：只返回 URL 和平台，让后续 AI 分类阶段处理
    return { title: '未命名内容', cover_url: null, platform, normalized_url: url }
  }
}
