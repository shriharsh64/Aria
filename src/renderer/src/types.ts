export interface DirEntry {
  name: string
  isDirectory: boolean
  path: string
}

export interface AriaAPI {
  apiCall: (endpoint: string, body: unknown) => Promise<unknown>
  apiStream: (endpoint: string, body: unknown) => Promise<string>
  readFile: (path: string) => Promise<{ content?: string; error?: string }>
  writeFile: (path: string, content: string) => Promise<{ success?: boolean; error?: string }>
  listDir: (path: string) => Promise<{ entries?: DirEntry[]; error?: string }>
  selectFolder: () => Promise<string | null>
  selectFile: () => Promise<string | null>
  minimize: () => void
  maximize: () => void
  close: () => void
  on: (channel: string, fn: (...args: unknown[]) => void) => void
  off: (channel: string, fn: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    aria: AriaAPI
  }
}
