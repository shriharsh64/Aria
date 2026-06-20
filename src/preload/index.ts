import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('aria', {
  // API calls to Python sidecar
  apiCall: (endpoint: string, body: unknown) =>
    ipcRenderer.invoke('api:call', endpoint, body),
  apiStream: (endpoint: string, body: unknown) =>
    ipcRenderer.invoke('api:stream', endpoint, body),

  // File system
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),
  listDir: (dirPath: string) => ipcRenderer.invoke('fs:listDir', dirPath),
  selectFolder: () => ipcRenderer.invoke('fs:selectFolder'),
  selectFile: () => ipcRenderer.invoke('fs:selectFile'),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Event listeners (for streaming updates from main)
  on: (channel: string, fn: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => fn(...args))
  },
  off: (channel: string, fn: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, fn)
  }
})
