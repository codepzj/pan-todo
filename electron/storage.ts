import { app } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'

// ============================================================================
// Todo Types and Storage
// ============================================================================

export interface TodoItem {
  id: string
  title: string
  description?: string
  quadrant: QuadrantType
  order: number
  createdAt: number
  updatedAt: number
}

export type QuadrantType =
  | 'urgent-important'
  | 'not-urgent-important'
  | 'urgent-not-important'
  | 'not-urgent-not-important'

/**
 * Get path for todos storage file
 */
export function getStoragePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'todos.json')
}

/**
 * Load todos from storage
 */
export async function loadTodos(): Promise<TodoItem[]> {
  try {
    const storagePath = getStoragePath()
    const content = await fs.readFile(storagePath, 'utf-8')
    const data = JSON.parse(content)
    return data.todos || []
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty array
      return []
    }
    console.error('Failed to load todos:', error.message)
    throw error
  }
}

/**
 * Save todos to storage
 */
export async function saveTodos(todos: TodoItem[]): Promise<void> {
  try {
    const storagePath = getStoragePath()
    const storageDir = path.dirname(storagePath)
    
    // Ensure directory exists
    await fs.mkdir(storageDir, { recursive: true })
    
    // Prepare data
    const data = {
      todos,
      version: '1.0.0',
      lastModified: new Date().toISOString(),
    }
    
    // Write to file
    await fs.writeFile(storagePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error: any) {
    console.error('Failed to save todos:', error.message)
    throw error
  }
}

// ============================================================================
// App Settings
// ============================================================================

export interface GitHubSyncConfig {
  enabled: boolean
  repo: string
  token: string
  lastSyncTime?: number
}

export interface AppSettings {
  showFloatingIcon: boolean
  githubSync?: GitHubSyncConfig
}

const DEFAULT_SETTINGS: AppSettings = {
  showFloatingIcon: true,
  githubSync: {
    enabled: false,
    repo: '',
    token: '',
  },
}

/**
 * Get path for settings file
 */
function getSettingsPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'settings.json')
}

/**
 * Load app settings
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const settingsPath = getSettingsPath()
    const content = await fs.readFile(settingsPath, 'utf-8')
    const settings = JSON.parse(content)
    return { ...DEFAULT_SETTINGS, ...settings }
  } catch (error) {
    // File doesn't exist or parse error - use defaults
    return DEFAULT_SETTINGS
  }
}

/**
 * Save app settings
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const settingsPath = getSettingsPath()
    const settingsDir = path.dirname(settingsPath)
    
    // Ensure directory exists
    await fs.mkdir(settingsDir, { recursive: true })
    
    // Write settings
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (error: any) {
    console.error('Failed to save settings:', error.message)
    throw error
  }
}

/**
 * Update specific settings
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings()
  const updated = { ...current, ...updates }
  await saveSettings(updated)
  return updated
}
