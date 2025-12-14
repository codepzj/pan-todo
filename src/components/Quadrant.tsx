import { useState, memo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from './ui/button'
import { TodoCard } from './TodoCard'
import { TodoForm } from './TodoForm'
import { useTodoStore } from '../hooks/useTodoStore'
import type { QuadrantType } from '../types/todo'

interface QuadrantProps {
  type: QuadrantType
  title: string
}

const QuadrantComponent = ({ type, title }: QuadrantProps) => {
  const [showForm, setShowForm] = useState(false)
  
  // Get todos for this quadrant using the selector
  const todos = useTodoStore((state) => state.getTodosByQuadrant(type))
  const addTodo = useTodoStore((state) => state.addTodo)
  const updateTodo = useTodoStore((state) => state.updateTodo)
  const deleteTodo = useTodoStore((state) => state.deleteTodo)

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleAddTodo = useCallback(async (title: string, description?: string) => {
    try {
      await addTodo(type, title, description)
      setShowForm(false)
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }, [addTodo, type])

  const handleEditTodo = useCallback(async (id: string, updates: Partial<{ title: string; description?: string }>) => {
    try {
      await updateTodo(id, updates)
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }, [updateTodo])

  const handleDeleteTodo = useCallback(async (id: string) => {
    try {
      await deleteTodo(id)
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }, [deleteTodo])

  return (
    <div className="h-full flex flex-col">
      {/* Title header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="quadrant-title text-foreground" id={`quadrant-${type}`}>
          {title}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowForm(!showForm)}
          className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={showForm ? "取消添加待办" : "添加待办"}
          aria-expanded={showForm}
          aria-controls={`form-${type}`}
        >
          <Plus className={`h-4 w-4 transition-transform duration-200 ${showForm ? 'rotate-45' : ''}`} />
        </Button>
      </div>

      {/* Todo form dialog */}
      <TodoForm
        open={showForm}
        onSubmit={handleAddTodo}
        onCancel={() => setShowForm(false)}
      />

      {/* List of todo cards */}
      <SortableContext
        items={todos.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          className="space-y-[var(--card-margin)] overflow-y-auto flex-1 custom-scrollbar pr-1"
          role="region"
          aria-labelledby={`quadrant-${type}`}
          aria-label={`${title}待办列表`}
        >
          {todos.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400" role="status">
              <svg 
                className="w-12 h-12 mb-2 opacity-30" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              <p className="text-xs">点击上方 + 添加待办</p>
            </div>
          )}
          {todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onEdit={handleEditTodo}
              onDelete={handleDeleteTodo}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const Quadrant = memo(QuadrantComponent, (prevProps, nextProps) => {
  // Only re-render if the type or title changes
  return prevProps.type === nextProps.type && prevProps.title === nextProps.title
})
