import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import { Quadrant } from './Quadrant'
import { TodoCard } from './TodoCard'
import { Header } from './Header'
import { useTodoStore } from '../hooks/useTodoStore'
import type { QuadrantType, TodoItem } from '../types/todo'

// Wrapper component for quadrant drop zones
function QuadrantWrapper({ 
  type, 
  className, 
  children 
}: { 
  type: QuadrantType
  className: string
  children: React.ReactNode 
}) {
  const { setNodeRef } = useDroppable({
    id: type,
  })
  
  return (
    <div 
      ref={setNodeRef}
      className={`p-[var(--quadrant-padding)] ${className}`}
    >
      {children}
    </div>
  )
}

export function Matrix() {
  const loadTodos = useTodoStore((state) => state.loadTodos)
  const moveTodo = useTodoStore((state) => state.moveTodo)
  const reorderTodos = useTodoStore((state) => state.reorderTodos)
  const todos = useTodoStore((state) => state.todos)
  const isLoading = useTodoStore((state) => state.isLoading)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Get the active todo for the drag overlay
  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null

  // Configure sensors for mouse and touch - instant activation
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 3, // Minimal distance for instant feel
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 0, // No delay
      tolerance: 3,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  // Load todos on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadTodos()
      } catch (err) {
        console.error('Failed to load todos on startup:', err)
        setError('无法加载待办事项。应用将以空状态启动。')
      }
    }
    
    initializeApp()
  }, [loadTodos])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag over for visual feedback
  const handleDragOver = (_event: DragOverEvent) => {
    // This provides smoother visual feedback during dragging
  }

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)

    // If dropped outside a valid target, do nothing
    if (!over) {
      console.log('Dropped outside valid target')
      return
    }

    const draggedId = active.id as string
    const targetId = over.id as string
    const activeTodo = active.data.current?.todo as TodoItem | undefined
    
    if (!activeTodo) {
      console.log('No active todo data')
      return
    }

    // Same item, no action needed
    if (draggedId === targetId) {
      console.log('Dropped on same item')
      return
    }

    const overTodo = over.data.current?.todo as TodoItem | undefined
    
    console.log('Drag end:', {
      draggedId,
      targetId,
      activeTodo: activeTodo.title,
      activeQuadrant: activeTodo.quadrant,
      overTodo: overTodo?.title,
      overQuadrant: overTodo?.quadrant,
    })
    
    if (overTodo) {
      // Dropped on another todo
      if (activeTodo.quadrant === overTodo.quadrant) {
        // Reordering within same quadrant
        console.log('Reordering within quadrant:', activeTodo.quadrant)
        try {
          await reorderTodos(activeTodo.quadrant, draggedId, targetId)
        } catch (error) {
          console.error('Failed to reorder todos:', error)
        }
      } else {
        // Moving to different quadrant
        console.log('Moving to different quadrant:', overTodo.quadrant)
        try {
          await moveTodo(draggedId, overTodo.quadrant)
        } catch (error) {
          console.error('Failed to move todo:', error)
        }
      }
    } else {
      // Dropped on a quadrant zone (not on a specific todo)
      const newQuadrant = targetId as QuadrantType
      if (activeTodo.quadrant !== newQuadrant) {
        console.log('Moving to empty quadrant:', newQuadrant)
        try {
          await moveTodo(draggedId, newQuadrant)
        } catch (error) {
          console.error('Failed to move todo:', error)
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadTodos().catch((err) => {
              console.error('Retry failed:', err)
              setError('重试失败。请重启应用。')
            })
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
        {/* Header */}
        <Header />
        
        {/* 2x2 Grid Layout for Eisenhower Matrix */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0 mt-14">
          {/* Quadrant 2: Not Urgent + Important (Top Left) */}
          <QuadrantWrapper type="not-urgent-important" className="border-r-2 border-b-2 border-border">
            <Quadrant type="not-urgent-important" title="重要不紧急" />
          </QuadrantWrapper>

          {/* Quadrant 1: Urgent + Important (Top Right) */}
          <QuadrantWrapper type="urgent-important" className="border-b-2 border-border">
            <Quadrant type="urgent-important" title="重要且紧急" />
          </QuadrantWrapper>

          {/* Quadrant 4: Not Urgent + Not Important (Bottom Left) */}
          <QuadrantWrapper type="not-urgent-not-important" className="border-r-2 border-border">
            <Quadrant type="not-urgent-not-important" title="不重要不紧急" />
          </QuadrantWrapper>

          {/* Quadrant 3: Urgent + Not Important (Bottom Right) */}
          <QuadrantWrapper type="urgent-not-important" className="border-border">
            <Quadrant type="urgent-not-important" title="紧急不重要" />
          </QuadrantWrapper>
        </div>
      </div>
      
      {/* Drag Overlay - shows a copy of the dragged item */}
      <DragOverlay 
        dropAnimation={{
          duration: 0, // Instant drop, no animation
          easing: 'ease',
        }}
        style={{ cursor: 'grabbing' }}
      >
        {activeTodo ? (
          <div className="opacity-90">
            <TodoCard
              todo={activeTodo}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
