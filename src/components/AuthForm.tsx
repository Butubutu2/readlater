'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { hasCloudData, syncToCloud, clearAllLocalData } from '@/lib/data-layer'
import { SyncDialog } from '@/components/SyncDialog'

type Mode = 'login' | 'register'

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [syncCloudExists, setSyncCloudExists] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    if (mode === 'register') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      // 注册成功，直接登录（不需要邮箱验证）
      router.push('/')
      router.refresh()
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // 登录成功，检查是否需要同步
      const cloudExists = await hasCloudData()
      setSyncCloudExists(cloudExists)
      setShowSync(true)
    }

    setLoading(false)
  }

  async function handleSyncChoice(mode: 'merge' | 'overwrite' | 'cancel') {
    setShowSync(false)

    if (mode === 'cancel') {
      router.push('/')
      router.refresh()
      return
    }

    if (mode === 'overwrite') {
      await syncToCloud()
      clearAllLocalData()
    } else if (mode === 'merge') {
      await syncToCloud()
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">邮箱</label>
          <input
            id="email"
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">密码</label>
          <input
            id="password"
            type="password"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
        </button>

        <p className="text-center text-sm text-gray-500">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="ml-1 text-gray-900 underline"
          >
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </form>

      {showSync && (
        <SyncDialog
          title={syncCloudExists ? '检测到已有云端数据' : '同步数据'}
          message={
            syncCloudExists
              ? '服务器上已有之前保存的内容，你想如何处理本地数据？'
              : '将本地数据同步到云端，登录后多设备共享。'
          }
          options={
            syncCloudExists
              ? [
                  { id: 'merge', label: '合并', desc: '保留云端数据，追加本地新内容' },
                  { id: 'overwrite', label: '覆盖云端', desc: '用本地数据替换云端所有数据' },
                  { id: 'cancel', label: '取消', desc: '暂不同步，直接进入' },
                ]
              : [
                  { id: 'merge', label: '开始同步', desc: '将本地数据上传到云端' },
                  { id: 'cancel', label: '取消', desc: '暂不同步' },
                ]
          }
          onSelect={(id) => handleSyncChoice(id as 'merge' | 'overwrite' | 'cancel')}
        />
      )}
    </>
  )
}
