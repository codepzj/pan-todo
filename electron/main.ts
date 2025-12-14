import { app, BrowserWindow } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'
import { registerIpcHandlers } from './ipc-handlers'
import { loadSettings, type AppSettings } from './storage'

// Define __dirname for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname)

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

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // 改为 false 以确保 preload 脚本能正常工作
    },
  })

  console.log('Window created with bounds:', mainWindow.getBounds())
  
  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
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

// Save window state before quit
app.on('before-quit', () => {
  saveWindowState()
})

// Export for IPC handlers (will be used in task 3.3)
export { mainWindow }
