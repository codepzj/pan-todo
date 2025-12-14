import { ipcMain, BrowserWindow, shell } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { loadTodos, saveTodos, TodoItem, getStoragePath, loadSettings, updateSettings } from './storage'
import { githubSync, GitHubSync } from './github-sync'

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Log the error for debugging
      console.error(`IPC Retry - Attempt ${attempt + 1} failed:`, error)
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt)
      
      console.log(`IPC Retry - Retrying in ${delay}ms...`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError
}

/**
 * Register all IPC handlers for the application
 */
export function registerIpcHandlers(
  getMainWindow: () => BrowserWindow | null,
  getSettings: () => any,
  setSettings: (settings: any) => void
) {
  // Handler: Load todos from storage
  ipcMain.handle('todos:load', async () => {
    try {
      const todos = await loadTodos()
      return todos
    } catch (error: any) {
      console.error('IPC todos:load error:', error.message)
      throw error
    }
  })

  // Handler: Save todos to storage
  ipcMain.handle('todos:save', async (_event, todos: TodoItem[]) => {
    try {
      await saveTodos(todos)
    } catch (error: any) {
      console.error('IPC todos:save error:', error.message)
      throw error
    }
  })

  // Handler: Create new todo with UUID and timestamps
  ipcMain.handle('todos:create', async (_event, todoData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    return retryWithBackoff(async () => {
      try {
        // Load current todos
        const todos = await loadTodos()

        // Get max order in the same quadrant
        const maxOrder = Math.max(
          -1,
          ...todos.filter(t => t.quadrant === todoData.quadrant).map(t => t.order ?? 0)
        )

        // Create new todo with generated fields
        const newTodo: TodoItem = {
          ...todoData,
          id: uuidv4(),
          order: maxOrder + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        // Add to list and save
        todos.push(newTodo)
        await saveTodos(todos)

        return newTodo
      } catch (error: any) {
        console.error('IPC todos:create error:', error.message)
        throw error
      }
    }, 3, 1000)
  })

  // Handler: Update existing todo
  ipcMain.handle('todos:update', async (_event, id: string, updates: Partial<TodoItem>) => {
    return retryWithBackoff(async () => {
      try {
        // Load current todos
        const todos = await loadTodos()

        // Find and update todo
        const todoIndex = todos.findIndex(t => t.id === id)
        if (todoIndex === -1) {
          throw new Error(`Todo with id ${id} not found`)
        }

        // Apply updates with new timestamp
        todos[todoIndex] = {
          ...todos[todoIndex],
          ...updates,
          id, // Ensure id cannot be changed
          updatedAt: Date.now(),
        }

        // Save
        await saveTodos(todos)
      } catch (error: any) {
        console.error('IPC todos:update error:', error.message)
        throw error
      }
    }, 3, 1000)
  })

  // Handler: Delete todo
  ipcMain.handle('todos:delete', async (_event, id: string) => {
    return retryWithBackoff(async () => {
      try {
        // Load current todos
        const todos = await loadTodos()

        // Filter out the todo
        const filteredTodos = todos.filter(t => t.id !== id)

        if (filteredTodos.length === todos.length) {
          console.warn(`Todo with id ${id} not found for deletion`)
        }

        // Save
        await saveTodos(filteredTodos)
      } catch (error: any) {
        console.error('IPC todos:delete error:', error.message)
        throw error
      }
    }, 3, 1000)
  })

  // Handler: Minimize window
  ipcMain.on('window:minimize', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  // Handler: Close window (hide to tray)
  ipcMain.on('window:close', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // Handler: Get storage path
  ipcMain.handle('storage:getPath', async () => {
    try {
      return getStoragePath()
    } catch (error: any) {
      console.error('Failed to get storage path:', error.message)
      throw error
    }
  })

  // Handler: Open storage folder
  ipcMain.handle('storage:openFolder', async () => {
    try {
      const storagePath = getStoragePath()
      const folderPath = path.dirname(storagePath)
      
      await shell.openPath(folderPath)
      return true
    } catch (error: any) {
      console.error('Failed to open folder:', error.message)
      throw error
    }
  })

  // Handler: Get app settings
  ipcMain.handle('settings:get', async () => {
    try {
      return await loadSettings()
    } catch (error: any) {
      console.error('Failed to get settings:', error.message)
      throw error
    }
  })

  // Handler: Update app settings
  ipcMain.handle('settings:update', async (_event, updates: any) => {
    try {
      const newSettings = await updateSettings(updates)
      setSettings(newSettings)
      
      // Handle GitHub sync configuration change
      if ('githubSync' in updates && updates.githubSync) {
        if (updates.githubSync.enabled && updates.githubSync.repo && updates.githubSync.token) {
          githubSync.configure({
            repo: updates.githubSync.repo,
            token: updates.githubSync.token,
          })
        }
      }
      
      return newSettings
    } catch (error: any) {
      console.error('Failed to update settings:', error.message)
      throw error
    }
  })

  // Handler: Test GitHub connection
  ipcMain.handle('github:test', async (_event, config: any) => {
    try {
      githubSync.configure(config)
      return await githubSync.testConnection()
    } catch (error: any) {
      console.error('Failed to test GitHub connection:', error.message)
      return { success: false, message: error.message }
    }
  })

  // Handler: Create GitHub repo
  ipcMain.handle('github:createRepo', async (_event, repoName: string, token: string) => {
    try {
      const sync = new GitHubSync()
      sync.configure({ repo: '', token })
      return await sync.createRepo(repoName)
    } catch (error: any) {
      console.error('Failed to create GitHub repo:', error.message)
      return { success: false, message: error.message }
    }
  })

  // Handler: Push to GitHub
  ipcMain.handle('github:push', async () => {
    try {
      const todos = await loadTodos()
      const data = {
        todos,
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      }
      return await githubSync.push(data)
    } catch (error: any) {
      console.error('Failed to push to GitHub:', error.message)
      return { success: false, message: error.message }
    }
  })

  // Handler: Pull from GitHub
  ipcMain.handle('github:pull', async () => {
    try {
      const result = await githubSync.pull()
      if (result.success && result.data) {
        // 保存拉取的数据
        await saveTodos(result.data.todos || [])
      }
      return result
    } catch (error: any) {
      console.error('Failed to pull from GitHub:', error.message)
      return { success: false, message: error.message }
    }
  })
}
