import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReadLater — 稍后观看',
  description: '收藏稍后看，AI 自动分类整理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
