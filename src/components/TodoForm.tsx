import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface TodoFormProps {
  open: boolean
  onSubmit: (title: string, description?: string) => void
  onCancel: () => void
}

export function TodoForm({ open, onSubmit, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate title is non-empty
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      // Reject empty title - don't submit
      return
    }

    // Submit the form
    const trimmedDescription = description.trim()
    onSubmit(trimmedTitle, trimmedDescription || undefined)
    
    // Clear form after successful submission
    setTitle('')
    setDescription('')
  }

  const handleCancel = () => {
    // Clear form and call cancel callback
    setTitle('')
    setDescription('')
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加待办事项</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题"
              className="text-sm border-gray-200 focus:border-gray-300 focus:ring-0"
              autoFocus
              aria-label="待办标题"
              aria-required="true"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述（可选）"
              className="text-sm min-h-[100px] border-gray-200 focus:border-gray-300 focus:ring-0 resize-none"
              aria-label="待办描述"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="取消 (Esc)"
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white"
              aria-label="添加 (Ctrl+Enter)"
            >
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
