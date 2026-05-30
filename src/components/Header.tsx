'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { getIsLoggedIn, clearAllLocalData, clearLoggedInFlag } from '@/lib/data-layer'
import { SyncDialog } from './SyncDialog'

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false)

  const updateAuthState = useCallback(() => {
    setLoggedIn(getIsLoggedIn())
  }, [])

  useEffect(() => {
    updateAuthState()
  }, [updateAuthState])

  function handleLoginClick() {
    setShowLoginPrompt(true)
  }

  function goLogin() {
    setShowLoginPrompt(false)
    window.location.href = '/auth'
  }

  function handleLogout() {
    setShowLogoutPrompt(true)
  }

  async function confirmLogout(clearData: boolean) {
    setShowLogoutPrompt(false)
    if (clearData) clearAllLocalData()
    clearLoggedInFlag()
    const supabase = createClient()
    await supabase.auth.signOut()
    setLoggedIn(false)
    window.location.reload()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">ReadLater</h1>
        <div className="flex items-center gap-3">
          <a href="/search" className="text-sm text-gray-500 hover:text-gray-700">
            搜索
          </a>
          <a href="/read" className="text-sm text-gray-500 hover:text-gray-700">
            已读
          </a>
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              退出
            </button>
          ) : (
            <button
              onClick={handleLoginClick}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              登录
            </button>
          )}
        </div>
      </div>

      {/* 登录前提示 */}
      {showLoginPrompt && (
        <SyncDialog
          title="登录同步"
          message="登录后将把本地保存的内容同步到云端，方便多设备查看。"
          options={[
            { id: 'go', label: '去登录', desc: '' },
            { id: 'cancel', label: '取消', desc: '' },
          ]}
          onSelect={(id) => {
            if (id === 'go') goLogin()
            else setShowLoginPrompt(false)
          }}
        />
      )}

      {/* 退出确认 */}
      {showLogoutPrompt && (
        <SyncDialog
          title="退出登录"
          message="已同步的数据保留在云端。是否清空本地缓存？"
          options={[
            { id: 'clear', label: '清空并退出', desc: '删除本地数据' },
            { id: 'keep', label: '保留退出', desc: '本地数据不变，仅退出登录' },
            { id: 'cancel', label: '取消', desc: '' },
          ]}
          onSelect={(id) => {
            if (id === 'cancel') setShowLogoutPrompt(false)
            else confirmLogout(id === 'clear')
          }}
        />
      )}
    </>
  )
}
