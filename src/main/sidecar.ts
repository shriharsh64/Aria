import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import log from 'electron-log'

let sidecarProcess: ChildProcess | null = null
const SIDECAR_PORT = 8765

export async function startSidecar(): Promise<void> {
  const backendPath = join(__dirname, '../../backend/main.py')

  sidecarProcess = spawn('python', [backendPath, '--port', String(SIDECAR_PORT)], {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  })

  sidecarProcess.stdout?.on('data', (d) => log.info('[sidecar]', d.toString().trim()))
  sidecarProcess.stderr?.on('data', (d) => log.warn('[sidecar]', d.toString().trim()))
  sidecarProcess.on('exit', (code) => log.info('[sidecar] exited with code', code))

  // Wait for sidecar to be ready
  await waitForSidecar()
}

async function waitForSidecar(retries = 20, delayMs = 500): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://localhost:${SIDECAR_PORT}/health`)
      if (res.ok) {
        log.info('[sidecar] ready')
        return
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  log.warn('[sidecar] did not become ready in time — continuing anyway')
}

export async function stopSidecar(): Promise<void> {
  if (sidecarProcess) {
    sidecarProcess.kill()
    sidecarProcess = null
  }
}

export const SIDECAR_URL = `http://localhost:${SIDECAR_PORT}`
