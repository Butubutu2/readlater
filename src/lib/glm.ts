import type { ClassificationResult } from './types'

// ============================================================
// 智谱 GLM-4V-Flash API 封装
// 文档：https://open.bigmodel.cn/dev/api/normal-model/glm-4
// ============================================================

interface GLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | GLMContentPart[]
}

interface GLMContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

interface GLMResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MODEL = 'glm-4v-flash'

/** 构建分类 Prompt（含 few-shot 示例） */
function buildClassifyPrompt(
  title: string,
  coverUrl: string | null,
  existingTags: string[]
): GLMMessage[] {
  const systemPrompt =
    '你是一个内容分类助手。请根据标题和封面图为该内容分配一个标签和一句话总结。' +
    '标签要求：简短、中文名词性短语。优先匹配用户已有标签列表，如有合适标签则复用，否则创建新标签。' +
    '总结要求：一句话概括核心内容（15-30 字）。' +
    '输出必须是 JSON 格式：{ "tag": "标签名", "summary": "一句话总结", "confidence": 0.0-1.0 }'

  const userContent: GLMContentPart[] = [
    {
      type: 'text',
      text: [
        '示例：',
        '标题："Next.js 14 发布，App Router 正式稳定"',
        '标签：前端开发',
        '总结："Next.js 14 正式版发布，App Router 和生产就绪的 Server Actions"',
        '',
        '标题："深入理解 Go 的并发模型"',
        '标签：编程语言',
        '总结："Go goroutine 和 channel 的设计哲学与实现原理"',
        '',
        '---',
        '',
        `标题：${title}`,
        `用户已有标签：${existingTags.length > 0 ? existingTags.join(', ') : '暂无'}`,
        '',
        '请输出 JSON：',
      ].join('\n'),
    },
  ]

  // 如果有封面图 URL，传给多模态模型
  if (coverUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: coverUrl },
    })
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]
}

/**
 * 调用智谱 GLM-4V-Flash 进行分类
 * @param title 内容标题
 * @param coverUrl 封面图 URL（可选）
 * @param existingTags 用户已有标签列表
 * @returns 分类结果
 */
export async function classifyWithGLM(
  title: string,
  coverUrl: string | null,
  existingTags: string[]
): Promise<ClassificationResult> {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 未配置')
  }

  const messages = buildClassifyPrompt(title, coverUrl, existingTags)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 512,
      top_p: 0.9,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GLM API 错误 (${response.status}): ${errorText}`)
  }

  const data: GLMResponse = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('GLM API 返回为空')
  }

  // 解析 JSON（模型可能用 ```json 包裹）
  const jsonStr = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()
  const result = JSON.parse(jsonStr) as ClassificationResult

  return {
    tag: result.tag || '未分类',
    summary: result.summary || '',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
  }
}
