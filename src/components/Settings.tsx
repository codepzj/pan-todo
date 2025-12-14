import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Copy, Check, FolderOpen } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { useTodoStore } from '../hooks/useTodoStore'

export function Settings() {
  const [open, setOpen] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [storagePath, setStoragePath] = useState<string>('加载中...')
  const todos = useTodoStore((state) => state.todos)

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

  // Load path when dialog opens
  useEffect(() => {
    if (open) {
      loadStoragePath()
    }
  }, [open])
  
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
