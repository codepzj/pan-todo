import { useState, useEffect } from 'react'
import { Upload, Download } from 'lucide-react'
import { Settings } from './Settings'
import { About } from './About'
import { Button } from './ui/button'
import { useTodoStore } from '../hooks/useTodoStore'
import { toast } from 'sonner'

export function Header() {
  const [syncing, setSyncing] = useState(false)
  const [githubEnabled, setGithubEnabled] = useState(false)
  const loadTodos = useTodoStore((state) => state.loadTodos)

  // Check if GitHub sync is enabled
  useEffect(() => {
    const checkGitHubConfig = async () => {
      if (window.electronAPI?.settings?.get) {
        try {
          const settings = await window.electronAPI.settings.get()
          const enabled = settings.githubSync?.enabled && 
                         settings.githubSync?.repo && 
                         settings.githubSync?.token
          setGithubEnabled(!!enabled)
        } catch (err) {
          console.error('Failed to check GitHub config:', err)
        }
      }
    }

    checkGitHubConfig()

    // Listen for settings changes
    const handleSettingsChange = () => checkGitHubConfig()
    window.addEventListener('settings-changed', handleSettingsChange)
    
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange)
    }
  }, [])

  const handlePush = async () => {
    if (!window.electronAPI?.github?.push) {
      toast.error('GitHub 同步功能不可用')
      return
    }

    setSyncing(true)
    try {
      const result = await window.electronAPI.github.push()
      
      if (result.success) {
        toast.success('推送成功')
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('推送失败')
    } finally {
      setSyncing(false)
    }
  }

  const handlePull = async () => {
    if (!window.electronAPI?.github?.pull) {
      toast.error('GitHub 同步功能不可用')
      return
    }

    setSyncing(true)
    try {
      const result = await window.electronAPI.github.pull()
      
      if (result.success) {
        toast.success('拉取成功')
        // 重新加载数据
        await loadTodos()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('拉取失败')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Pan Todo</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">待办</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* GitHub Sync Buttons - Only show if configured */}
          {githubEnabled && window.electronAPI && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md hover:bg-gray-100"
                onClick={handlePush}
                disabled={syncing}
                title="推送到 GitHub"
              >
                <Upload className={`h-4 w-4 text-gray-600 ${syncing ? 'animate-pulse' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md hover:bg-gray-100"
                onClick={handlePull}
                disabled={syncing}
                title="从 GitHub 拉取"
              >
                <Download className={`h-4 w-4 text-gray-600 ${syncing ? 'animate-pulse' : ''}`} />
              </Button>
            </>
          )}
          <About />
          <Settings />
        </div>
      </div>
    </header>
  )
}
