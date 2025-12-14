import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Copy, Check, FolderOpen, Github, Upload, Download, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { useTodoStore } from '../hooks/useTodoStore'
import { toast } from 'sonner'

interface GitHubSyncConfig {
  enabled: boolean
  repo: string
  token: string
  lastSyncTime?: number
}

export function Settings() {
  const [open, setOpen] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [storagePath, setStoragePath] = useState<string>('加载中...')
  const [githubSync, setGitHubSync] = useState<GitHubSyncConfig>({
    enabled: false,
    repo: '',
    token: '',
  })
  const [syncing, setSyncing] = useState(false)
  const todos = useTodoStore((state) => state.todos)
  const loadTodos = useTodoStore((state) => state.loadTodos)

  const loadStoragePath = async () => {
    if (window.electronAPI?.storage?.getPath) {
      try {
        const path = await window.electronAPI.storage.getPath()
        setStoragePath(path)
      } catch (err) {
        console.error('Failed to get storage path:', err)
        setStoragePath('无法获取路径')
      }
    } else {
      // Browser mode
      setStoragePath('localStorage (浏览器存储)')
    }
  }

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadStoragePath()
      loadGitHubSettings()
    }
  }, [open])

  const loadGitHubSettings = async () => {
    if (window.electronAPI?.settings?.get) {
      try {
        const settings = await window.electronAPI.settings.get()
        if (settings.githubSync) {
          setGitHubSync(settings.githubSync)
        }
      } catch (err) {
        console.error('Failed to load GitHub settings:', err)
      }
    }
  }

  const updateGitHubSync = async (updates: Partial<GitHubSyncConfig>) => {
    const newConfig = { ...githubSync, ...updates }
    setGitHubSync(newConfig)
    
    if (window.electronAPI?.settings?.update) {
      try {
        await window.electronAPI.settings.update({
          githubSync: newConfig
        })
        // Notify other components that settings changed
        window.dispatchEvent(new Event('settings-changed'))
      } catch (err) {
        console.error('Failed to update GitHub settings:', err)
      }
    }
  }

  const testConnection = async () => {
    if (!window.electronAPI?.github?.test) {
      toast.error('GitHub 同步功能不可用')
      return
    }
    
    if (!githubSync.repo || !githubSync.token) {
      toast.error('请填写仓库和 Token')
      return
    }

    setSyncing(true)
    try {
      const result = await window.electronAPI.github.test({
        repo: githubSync.repo,
        token: githubSync.token,
      })
      
      if (result.success) {
        toast.success('连接成功！')
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('测试连接失败')
    } finally {
      setSyncing(false)
    }
  }

  const createRepo = async () => {
    if (!window.electronAPI?.github?.createRepo) {
      toast.error('GitHub 同步功能不可用')
      return
    }
    
    if (!githubSync.token) {
      toast.error('请先填写 GitHub Token')
      return
    }

    setSyncing(true)
    try {
      const repoName = 'todo-sync'
      const result = await window.electronAPI.github.createRepo(repoName, githubSync.token)
      
      if (result.success && result.repo) {
        await updateGitHubSync({ repo: result.repo })
        toast.success('仓库创建成功！')
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('创建仓库失败')
    } finally {
      setSyncing(false)
    }
  }

  const pushToGitHub = async () => {
    if (!window.electronAPI?.github?.push) {
      toast.error('GitHub 同步功能不可用')
      return
    }

    setSyncing(true)
    try {
      const result = await window.electronAPI.github.push()
      
      if (result.success) {
        await updateGitHubSync({ lastSyncTime: result.lastSyncTime })
        toast.success('推送成功！')
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('推送失败')
    } finally {
      setSyncing(false)
    }
  }

  const pullFromGitHub = async () => {
    if (!window.electronAPI?.github?.pull) {
      toast.error('GitHub 同步功能不可用')
      return
    }

    setSyncing(true)
    try {
      const result = await window.electronAPI.github.pull()
      
      if (result.success) {
        toast.success('拉取成功！')
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
  
  // Format JSON for display
  const jsonContent = JSON.stringify(
    {
      todos,
      version: '1.0.0',
    },
    null,
    2
  )

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(storagePath)
      setCopiedPath(true)
      setTimeout(() => setCopiedPath(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent)
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenFolder = async () => {
    if (window.electronAPI?.storage?.openFolder) {
      try {
        await window.electronAPI.storage.openFolder()
      } catch (err) {
        console.error('Failed to open folder:', err)
        alert('无法打开文件夹')
      }
    } else {
      alert('浏览器模式下无法打开文件夹')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-md hover:bg-gray-100"
          aria-label="设置"
        >
          <SettingsIcon className="h-4 w-4 text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
          {/* GitHub Sync - Only show in Electron */}
          {window.electronAPI && (
            <div className="space-y-3 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">GitHub 同步</h3>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">启用 GitHub 同步</div>
                    <div className="text-xs text-gray-500">将待办数据同步到 GitHub 私有仓库</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={githubSync.enabled}
                    onChange={(e) => updateGitHubSync({ enabled: e.target.checked })}
                    className="ml-3 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </label>

                {githubSync.enabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600">仓库 (owner/repo)</label>
                      <Input
                        placeholder="例如: codepzj/todo-sync"
                        value={githubSync.repo}
                        onChange={(e) => updateGitHubSync({ repo: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-600">GitHub Token</label>
                      <Input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={githubSync.token}
                        onChange={(e) => updateGitHubSync({ token: e.target.value })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        需要 <code className="px-1 py-0.5 bg-gray-100 rounded">repo</code> 权限
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={testConnection}
                        disabled={syncing || !githubSync.repo || !githubSync.token}
                        className="text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                        测试连接
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={createRepo}
                        disabled={syncing || !githubSync.token}
                        className="text-xs"
                      >
                        <Github className="h-3 w-3 mr-1" />
                        创建仓库
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={pushToGitHub}
                        disabled={syncing || !githubSync.repo || !githubSync.token}
                        className="text-xs"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        推送
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={pullFromGitHub}
                        disabled={syncing || !githubSync.repo || !githubSync.token}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        拉取
                      </Button>
                    </div>

                    {githubSync.lastSyncTime && (
                      <p className="text-xs text-gray-500">
                        上次同步: {new Date(githubSync.lastSyncTime).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Storage Path */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">数据存储路径</h3>
              <div className="flex gap-1">
                {window.electronAPI && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenFolder}
                    className="h-7 px-2 text-xs"
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    打开文件夹
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPath}
                  className="h-7 px-2 text-xs"
                >
                  {copiedPath ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <code className="text-xs text-gray-700 break-all">{storagePath}</code>
            </div>
          </div>

          {/* JSON Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                数据内容 ({todos.length} 个待办)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyJson}
                className="h-7 px-2 text-xs"
              >
                {copiedJson ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    复制 JSON
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-[400px] overflow-y-auto custom-scrollbar">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                {jsonContent}
              </pre>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 提示：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>数据自动保存到本地文件</li>
              <li>可以手动备份 JSON 文件</li>
              <li>浏览器模式使用 localStorage 存储</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={() => setOpen(false)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
