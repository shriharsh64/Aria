import { ipcMain, BrowserWindow, dialog } from 'electron'
import { SIDECAR_URL } from './sidecar'
import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export function registerIpcHandlers(win: BrowserWindow | null): void {
  // --- Sidecar proxy: forwards all agent API calls to Python backend ---
  ipcMain.handle('api:call', async (_event, endpoint: string, body: unknown) => {
    try {
      const res = await fetch(`${SIDECAR_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      return await res.json()
    } catch (err) {
      log.error('[ipc] api:call failed', err)
      return { error: String(err) }
    }
  })

  // --- Streaming proxy for chat messages ---
  ipcMain.handle('api:stream', async (_event, endpoint: string, body: unknown) => {
    const res = await fetch(`${SIDECAR_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const text = await res.text()
    return text
  })

  // --- File system operations ---
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      return { content: fs.readFileSync(filePath, 'utf-8') }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('fs:listDir', async (_event, dirPath: string) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      return {
        entries: entries.map((e) => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: path.join(dirPath, e.name)
        }))
      }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('fs:selectFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('fs:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['md', 'txt', 'pdf', 'docx', 'csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // --- Emit events to renderer (for progress updates etc.) ---
  ipcMain.on('emit:toRenderer', (_event, channel: string, data: unknown) => {
    win?.webContents.send(channel, data)
  })
}
