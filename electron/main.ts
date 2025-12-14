import { app, BrowserWindow } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { registerIpcHandlers } from './ipc-handlers'
import { loadSettings, type AppSettings } from './storage'
import { githubSync } from './github-sync'
import { saveTodos, loadTodos } from './storage'

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let floatingIcon: BrowserWindow | null = null
let appSettings: AppSettings

// Window state persistence
interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
}

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1200,
  height: 800,
}

/**
 * Get path for window state file
 */
function getWindowStatePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'window-state.json')
}

/**
 * Load saved window state
 */
async function loadWindowState(): Promise<WindowState> {
  try {
    const statePath = getWindowStatePath()
    const content = await fs.readFile(statePath, 'utf-8')
    const state = JSON.parse(content)
    return { ...DEFAULT_WINDOW_STATE, ...state }
  } catch (error) {
    // File doesn't exist or parse error - use defaults
    return DEFAULT_WINDOW_STATE
  }
}

/**
 * Save window state
 */
async function saveWindowState(): Promise<void> {
  if (!mainWindow) return

  try {
    const bounds = mainWindow.getBounds()
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    }

    const statePath = getWindowStatePath()
    const stateDir = path.dirname(statePath)
    
    // Ensure directory exists
    await fs.mkdir(stateDir, { recursive: true })
    
    // Write state
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8')
  } catch (error: any) {
    console.error('Failed to save window state:', error.message)
  }
}

/**

/**
 * Create system tray
 */

/**
 * Create main window
 */
async function createWindow() {
  // Load saved window state
  const windowState = await loadWindowState()

  // Get preload path - works in both dev and production
  const preloadPath = app.isPackaged
    ? path.join(app.getAppPath(), 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  console.log('Window created with bounds:', mainWindow.getBounds())
  
  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = app.isPackaged
      ? path.join(app.getAppPath(), 'dist', 'index.html')
      : path.join(__dirname, '../dist/index.html')
    console.log('Loading production build:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // Save window state on move or resize
  mainWindow.on('moved', () => {
    saveWindowState()
  })

  mainWindow.on('resized', () => {
    saveWindowState()
  })



  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Initialize app
app.whenReady().then(async () => {
  // Load settings
  appSettings = await loadSettings()
  
  // Register IPC handlers
  registerIpcHandlers(() => mainWindow, () => appSettings, (settings) => {
    appSettings = settings
  })
  
  await createWindow()
  
  // Ensure window is shown and focused
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
  
  // Auto-sync: Pull from GitHub on startup
  if (appSettings.githubSync?.enabled && appSettings.githubSync.repo && appSettings.githubSync.token) {
    try {
      githubSync.configure({
        repo: appSettings.githubSync.repo,
        token: appSettings.githubSync.token,
      })
      
      const result = await githubSync.pull()
      if (result.success && result.data) {
        await saveTodos(result.data.todos || [])
        console.log('Auto-sync: Successfully pulled data from GitHub')
      }
    } catch (error) {
      console.error('Auto-sync pull failed:', error)
    }
  }
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Save window state before quit and auto-sync
app.on('before-quit', async (event) => {
  saveWindowState()
  
  // Auto-sync: Push to GitHub on quit
  if (appSettings.githubSync?.enabled && appSettings.githubSync.repo && appSettings.githubSync.token) {
    try {
      event.preventDefault() // Prevent quit until sync completes
      
      githubSync.configure({
        repo: appSettings.githubSync.repo,
        token: appSettings.githubSync.token,
      })
      
      const todos = await loadTodos()
      const data = {
        todos,
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      }
      
      await githubSync.push(data)
      console.log('Auto-sync: Successfully pushed data to GitHub')
    } catch (error) {
      console.error('Auto-sync push failed:', error)
    } finally {
      app.exit() // Now actually quit
    }
  }
})

// Export for IPC handlers (will be used in task 3.3)
export { mainWindow }
