import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

export function About() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-md hover:bg-gray-100"
          aria-label="关于"
        >
          <FileText className="h-4 w-4 text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>关于 Pan Todo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* App Info */}
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pan Todo</h2>
            <p className="text-sm text-gray-600 mb-1">版本 1.0.0</p>
            <p className="text-xs text-gray-500">基于艾森豪威尔矩阵的待办管理工具</p>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">特性</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>四象限任务优先级管理</li>
              <li>拖拽排序和移动</li>
              <li>本地数据存储</li>
              <li>极简设计风格</li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">技术栈</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Electron</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">React</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">TypeScript</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Vite</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">shadcn/ui</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-2">
              <p>© 2025 Pan Todo. All rights reserved.</p>
              <p>
                本软件基于 MIT 许可证开源。
                <br />
                您可以自由使用、修改和分发本软件。
              </p>
              <p className="text-gray-400">
                Made by <a href="https://github.com/codepzj/pan-todo" className="text-gray-400 hover:text-gray-500">codepzj</a>
              </p>
            </div>
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
