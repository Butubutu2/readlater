'use client'

import { AuthForm } from '@/components/AuthForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function AuthPage() {
  const router = useRouter()

  // 如果已登录，直接跳转主页
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">ReadLater</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          收藏稍后看，AI 自动分类
        </p>
        <AuthForm />
      </div>
    </main>
  )
}
