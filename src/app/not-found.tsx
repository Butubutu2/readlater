'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-6xl">404</div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">页面不存在</h1>
      <p className="mb-8 text-sm text-gray-500">你访问的页面不存在或已被移除</p>
      <div className="flex gap-3">
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          返回上一页
        </button>
        <Link
          href="/"
          className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          回到主页
        </Link>
      </div>
    </main>
  )
}
