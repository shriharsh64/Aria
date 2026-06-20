import React, { useEffect } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import TitleBar from '../components/TitleBar'
import Sidebar from '../components/Sidebar'
import ChatView from '../components/Chat/ChatView'
import Dashboard from '../components/Dashboard/Dashboard'
import RoadmapView from '../components/Roadmap/RoadmapView'
import ResearchView from '../components/Research/ResearchView'
import FileManagerView from '../components/FileManager/FileManagerView'
import SetupModal from '../components/SetupModal'
import './types'

export default function App(): React.JSX.Element {
  const { activeView, sidecarReady, setSidecarReady, project } = useProjectStore()

  // Poll sidecar health on mount
  useEffect(() => {
    const check = async (): Promise<void> => {
      try {
        const res = await fetch('http://localhost:8765/health')
        if (res.ok) setSidecarReady(true)
      } catch {
        setSidecarReady(false)
      }
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [setSidecarReady])

  const showSetup = !project

  return (
    <div className="flex flex-col h-screen bg-aria-bg text-aria-text overflow-hidden">
      <TitleBar sidecarReady={sidecarReady} />
      {showSetup ? (
        <SetupModal />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {activeView === 'chat' && <ChatView />}
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'roadmap' && <RoadmapView />}
            {activeView === 'research' && <ResearchView />}
            {activeView === 'files' && <FileManagerView />}
          </main>
        </div>
      )}
    </div>
  )
}
