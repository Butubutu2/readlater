'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { getIsLoggedIn, hasCloudData, syncToCloud, clearAllLocalData } from '@/lib/data-layer'
import { SyncDialog } from './SyncDialog'

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [syncDialogType, setSyncDialogType] = useState<'sync' | 'logout'>('sync')
  const [hasExistingCloudData, setHasExistingCloudData] = useState(false)

  const updateAuthState = useCallback(() => {
    setLoggedIn(getIsLoggedIn())
  }, [])

  useEffect(() => {
    updateAuthState()
  }, [updateAuthState])

  async function handleLoginClick() {
    window.location.href = '/auth'
  }

  async function handleSync() {
    // 检查服务器是否有现有数据
    if (loggedIn) {
      const existing = await hasCloudData()
      setHasExistingCloudData(existing)
      setSyncDialogType('sync')
      setShowSyncDialog(true)
    }
  }

  async function handleLogout() {
    setSyncDialogType('logout')
    setShowSyncDialog(true)
  }

  async function doSync(mode: 'merge' | 'overwrite' | 'cancel') {
    setShowSyncDialog(false)
    if (mode === 'cancel') return

    if (mode === 'overwrite' && loggedIn) {
      // 推送本地数据到服务器
      await syncToCloud((current, total) => {
        console.log(`Syncing ${current}/${total}`)
      })
      clearAllLocalData()
      window.location.reload()
    } else if (mode === 'merge' && loggedIn) {
      await syncToCloud()
      window.location.reload()
    }
  }

  async function confirmLogout(clearData: boolean) {
    setShowSyncDialog(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    if (clearData) clearAllLocalData()
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
            <>
              <button
                onClick={handleSync}
                className="text-sm text-blue-500 hover:text-blue-700"
                title="同步本地数据到云端"
              >
                同步
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                退出
              </button>
            </>
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

      {showSyncDialog && syncDialogType === 'sync' && (
        <SyncDialog
          title={hasExistingCloudData ? '检测到已有云端数据' : '同步数据'}
          message={
            hasExistingCloudData
              ? '服务器上已有之前保存的内容，你想如何处理？'
              : '本地数据将同步到云端，登录后多设备共享。'
          }
          options={
            hasExistingCloudData
              ? [
                  { id: 'merge', label: '合并', desc: '保留云端数据，追加本地新内容' },
                  { id: 'overwrite', label: '覆盖云端', desc: '用本地数据替换云端所有数据' },
                  { id: 'cancel', label: '取消', desc: '暂不同步' },
                ]
              : [
                  { id: 'merge', label: '开始同步', desc: '' },
                  { id: 'cancel', label: '取消', desc: '' },
                ]
          }
          onSelect={(id) => doSync(id as 'merge' | 'overwrite' | 'cancel')}
        />
      )}

      {showSyncDialog && syncDialogType === 'logout' && (
        <SyncDialog
          title="退出登录"
          message="已同步的数据仍保留在云端。是否清空本地缓存数据？"
          options={[
            { id: 'clear', label: '清空', desc: '退出并清除本地数据' },
            { id: 'keep', label: '保留', desc: '本地数据不变，仅退出登录' },
            { id: 'cancel', label: '取消', desc: '' },
          ]}
          onSelect={(id) => {
            if (id === 'cancel') setShowSyncDialog(false)
            else confirmLogout(id === 'clear')
          }}
        />
      )}
    </>
  )
}
