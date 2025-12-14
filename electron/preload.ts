import { contextBridge, ipcRenderer } from 'electron'
import type { TodoItem } from './storage'

export interface AppSettings {
  showFloatingIcon: boolean
}

// Define the API interface for type safety
export interface ElectronAPI {
  // Todo operations
  todos: {
    load: () => Promise<TodoItem[]>
    save: (todos: TodoItem[]) => Promise<void>
    create: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TodoItem>
    update: (id: string, updates: Partial<TodoItem>) => Promise<void>
    delete: (id: string) => Promise<void>
  }
  // Storage operations
  storage: {
    getPath: () => Promise<string>
    openFolder: () => Promise<boolean>
  }
  // Settings operations
  settings: {
    get: () => Promise<AppSettings>
    update: (updates: Partial<AppSettings>) => Promise<AppSettings>
  }
  // Window operations
  window: {
    minimize: () => void
    close: () => void
  }
}

// Expose safe IPC APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  todos: {
    load: () => ipcRenderer.invoke('todos:load'),
    save: (todos: TodoItem[]) => ipcRenderer.invoke('todos:save', todos),
    create: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => 
      ipcRenderer.invoke('todos:create', todo),
    update: (id: string, updates: Partial<TodoItem>) => 
      ipcRenderer.invoke('todos:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('todos:delete', id),
  },
  storage: {
    getPath: () => ipcRenderer.invoke('storage:getPath'),
    openFolder: () => ipcRenderer.invoke('storage:openFolder'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (updates: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', updates),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    close: () => ipcRenderer.send('window:close'),
  },
} as ElectronAPI)
