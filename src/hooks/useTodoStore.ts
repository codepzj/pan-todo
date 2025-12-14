import { create } from 'zustand'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import type { TodoItem, QuadrantType } from '../types/todo'

// Browser fallback using localStorage
const STORAGE_KEY = 'eisenhower-todos'
const SETTINGS_KEY = 'eisenhower-settings'

interface AppSettings {
  showQuadrantIndicator: boolean
}

const defaultSettings: AppSettings = {
  showQuadrantIndicator: false,
}

const browserStorage = {
  load: async (): Promise<TodoItem[]> => {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },
  save: async (todos: TodoItem[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  },
  create: async (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> => {
    const todos = await browserStorage.load()
    // Get max order in the same quadrant
    const maxOrder = Math.max(
      -1,
      ...todos.filter(t => t.quadrant === todo.quadrant).map(t => t.order ?? 0)
    )
    const newTodo: TodoItem = {
      ...todo,
      id: uuidv4(),
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    todos.push(newTodo)
    await browserStorage.save(todos)
    return newTodo
  },
  update: async (id: string, updates: Partial<TodoItem>): Promise<void> => {
    const todos = await browserStorage.load()
    const index = todos.findIndex(t => t.id === id)
    if (index !== -1) {
      todos[index] = { ...todos[index], ...updates, updatedAt: Date.now() }
      await browserStorage.save(todos)
    }
  },
  delete: async (id: string): Promise<void> => {
    const todos = await browserStorage.load()
    await browserStorage.save(todos.filter(t => t.id !== id))
  },
}

// Use Electron API if available, otherwise use browser storage
const storage = window.electronAPI?.todos || browserStorage

interface TodoStore {
  // State
  todos: TodoItem[]
  isLoading: boolean
  settings: AppSettings
  
  // Actions
  loadTodos: () => Promise<void>
  addTodo: (quadrant: QuadrantType, title: string, description?: string) => Promise<void>
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  moveTodo: (id: string, newQuadrant: QuadrantType) => Promise<void>
  reorderTodos: (quadrant: QuadrantType, activeId: string, overId: string) => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => void
  
  // Selectors
  getTodosByQuadrant: (quadrant: QuadrantType) => TodoItem[]
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  // Initial state
  todos: [],
  isLoading: false,
  settings: (() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })(),
  
  // Load todos from storage via IPC
  loadTodos: async () => {
    set({ isLoading: true })
    try {
      let todos = await storage.load()
      
      // Ensure all todos have an order field
      todos = todos.map((todo: TodoItem, index: number) => ({
        ...todo,
        order: todo.order ?? index,
      }))
      
      set({ todos, isLoading: false })
      if (!window.electronAPI) {
        console.warn('Running in browser mode with localStorage')
      }
    } catch (error) {
      console.error('Failed to load todos:', error)
      toast.error('加载待办事项失败')
      set({ isLoading: false })
      throw error
    }
  },
  
  // Add a new todo via IPC
  addTodo: async (quadrant: QuadrantType, title: string, description?: string) => {
    try {
      const newTodo = await storage.create({
        title,
        description,
        quadrant,
      })
      set((state) => ({
        todos: [...state.todos, newTodo],
      }))
      toast.success('待办事项已创建')
    } catch (error) {
      console.error('Failed to add todo:', error)
      toast.error('创建待办事项失败')
      throw error
    }
  },
  
  // Update an existing todo via IPC
  updateTodo: async (id: string, updates: Partial<TodoItem>) => {
    try {
      await storage.update(id, updates)
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updates, updatedAt: Date.now() } : todo
        ),
      }))
      toast.success('待办事项已更新')
    } catch (error) {
      console.error('Failed to update todo:', error)
      toast.error('更新待办事项失败')
      throw error
    }
  },
  
  // Delete a todo via IPC
  deleteTodo: async (id: string) => {
    try {
      await storage.delete(id)
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }))
      toast.success('待办事项已删除')
    } catch (error) {
      console.error('Failed to delete todo:', error)
      toast.error('删除待办事项失败')
      throw error
    }
  },
  
  // Move a todo to a different quadrant via IPC
  moveTodo: async (id: string, newQuadrant: QuadrantType) => {
    try {
      // Get max order in target quadrant
      const todos = get().todos
      const maxOrder = Math.max(
        -1,
        ...todos.filter(t => t.quadrant === newQuadrant).map(t => t.order ?? 0)
      )
      
      await storage.update(id, { quadrant: newQuadrant, order: maxOrder + 1 })
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, quadrant: newQuadrant, order: maxOrder + 1, updatedAt: Date.now() } : todo
        ),
      }))
      toast.success('待办事项已移动')
    } catch (error) {
      console.error('Failed to move todo:', error)
      toast.error('移动待办事项失败')
      throw error
    }
  },
  
  // Reorder todos within a quadrant
  reorderTodos: async (quadrant: QuadrantType, activeId: string, overId: string) => {
    const allTodos = get().todos
    const quadrantTodos = allTodos
      .filter(t => t.quadrant === quadrant)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    
    const oldIndex = quadrantTodos.findIndex(t => t.id === activeId)
    const newIndex = quadrantTodos.findIndex(t => t.id === overId)
    
    console.log('Reorder attempt:', {
      quadrant,
      activeId,
      overId,
      oldIndex,
      newIndex,
      quadrantTodosCount: quadrantTodos.length,
      quadrantTodos: quadrantTodos.map(t => ({ id: t.id, title: t.title, order: t.order }))
    })
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error('Invalid indices:', { oldIndex, newIndex })
      return
    }
    
    if (oldIndex === newIndex) {
      console.log('Same position, no reorder needed')
      return
    }
    
    // Reorder the array
    const reordered = [...quadrantTodos]
    const [movedItem] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, movedItem)
    
    console.log('After reorder:', reordered.map(t => ({ id: t.id, title: t.title })))
    
    // Create a map of id -> new order for all items in this quadrant
    const orderMap = new Map(reordered.map((todo, index) => [todo.id, index]))
    
    // Optimistic update - update UI immediately
    set((state) => ({
      todos: state.todos.map((todo) => {
        const newOrder = orderMap.get(todo.id)
        if (newOrder !== undefined) {
          console.log(`Updating ${todo.title}: order ${todo.order} -> ${newOrder}`)
          return { ...todo, order: newOrder, updatedAt: Date.now() }
        }
        return todo
      }),
    }))
    
    // Persist to storage in background
    Promise.all(
      Array.from(orderMap.entries()).map(([id, order]) => 
        storage.update(id, { order }).catch((err: unknown) => {
          console.error(`Failed to update order for ${id}:`, err)
          throw err
        })
      )
    ).catch((error: unknown) => {
      console.error('Failed to persist reorder:', error)
      toast.error('保存顺序失败')
    })
  },
  
  // Update settings
  updateSettings: (updates: Partial<AppSettings>) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
      return { settings: newSettings }
    })
  },
  
  // Selector: Get todos by quadrant (sorted by order)
  getTodosByQuadrant: (quadrant: QuadrantType) => {
    const filtered = get().todos.filter((todo) => todo.quadrant === quadrant)
    const sorted = filtered.sort((a, b) => {
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      return orderA - orderB
    })
    return sorted
  },
}))
