import { useState, memo, useEffect, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import type { TodoItem } from '../types/todo'

interface TodoCardProps {
  todo: TodoItem
  onEdit: (id: string, updates: Partial<TodoItem>) => void
  onDelete: (id: string) => void
}

const TodoCardComponent = ({ todo, onEdit, onDelete }: TodoCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDescription, setEditDescription] = useState(todo.description || '')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Set up sortable functionality
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: todo.id,
    data: { todo },
    disabled: isEditing, // Disable dragging while editing
    transition: null, // Disable transition for instant feel
  })

  // Apply transform styles during drag - no transition for instant response
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'none', // No transition for instant movement
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : isEditing ? 'default' : 'grab',
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Handle keyboard shortcuts in edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Escape') {
        handleCancel()
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    }
  }

  const handleSave = () => {
    // Validate title is non-empty
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      // Reject empty title and restore previous value
      setEditTitle(todo.title)
      return
    }

    // Update the todo
    onEdit(todo.id, {
      title: trimmedTitle,
      description: editDescription.trim() || undefined,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Restore original values
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
    setIsEditing(false)
  }

  const handleDelete = () => {
    setIsDeleting(true)
  }

  const confirmDelete = () => {
    onDelete(todo.id)
    setIsDeleting(false)
  }

  const cancelDelete = () => {
    setIsDeleting(false)
  }



  // Display mode - draggable
  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[500px]" onKeyDown={handleKeyDown}>
          <DialogHeader>
            <DialogTitle>编辑待办事项</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="标题"
                className="text-sm border-gray-200 focus:border-gray-300 focus:ring-0"
                autoFocus
                aria-label="待办标题"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="描述（可选）"
                className="text-sm min-h-[100px] border-gray-200 focus:border-gray-300 focus:ring-0 resize-none"
                aria-label="待办描述"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="取消编辑 (Esc)"
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gray-900 hover:bg-gray-800 text-white"
                aria-label="保存编辑 (Ctrl+Enter)"
              >
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              确定要删除待办事项 <span className="font-medium text-gray-900">"{todo.title}"</span> 吗？
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={cancelDelete}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                取消
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                删除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Todo Card */}
      <div ref={setNodeRef} style={style}>
        <Card className={`p-3 hover:shadow-md transition-shadow duration-200 group ${
          isDragging ? 'border-2 border-dashed border-gray-400' : ''
        }`}>
        <CardContent className="p-0">
          <div className="flex justify-between items-start gap-2">
            <div 
              className="flex-1 min-w-0 cursor-grab active:cursor-grabbing" 
              {...listeners} 
              {...attributes}
              role="button"
              tabIndex={0}
              aria-label={`拖动待办: ${todo.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsEditing(true)
                }
              }}
            >
              <h3 className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                {todo.title}
              </h3>
              {todo.description && (
                <p className="text-xs text-gray-600 mt-1.5 break-words leading-relaxed">
                  {todo.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setIsEditing(true)}
                aria-label="编辑待办"
                tabIndex={0}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                onClick={handleDelete}
                aria-label="删除待办"
                tabIndex={0}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const TodoCard = memo(TodoCardComponent, (prevProps, nextProps) => {
  // Only re-render if the todo data changes
  return (
    prevProps.todo.id === nextProps.todo.id &&
    prevProps.todo.title === nextProps.todo.title &&
    prevProps.todo.description === nextProps.todo.description &&
    prevProps.todo.quadrant === nextProps.todo.quadrant &&
    prevProps.todo.updatedAt === nextProps.todo.updatedAt
  )
})
