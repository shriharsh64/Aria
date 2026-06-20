import React from 'react'
import { useProjectStore } from '../stores/useProjectStore'

type View = 'chat' | 'dashboard' | 'roadmap' | 'research' | 'files' | 'papers'

interface NavItem {
  view: View
  label: string
  icon: string
}

const NAV: NavItem[] = [
  { view: 'chat', label: 'Chat', icon: '💬' },
  { view: 'dashboard', label: 'Dashboard', icon: '📊' },
  { view: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  { view: 'research', label: 'Research', icon: '🔬' },
  { view: 'files', label: 'Files', icon: '📁' },
  { view: 'papers', label: 'Papers', icon: '📄' },
]

export default function Sidebar(): React.JSX.Element {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, project } = useProjectStore()

  const progress = project?.overallProgress ?? 0

  return (
    <aside
      className={`flex flex-col bg-aria-surface border-r border-aria-border flex-shrink-0 transition-all duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Project name */}
      {!sidebarCollapsed && project && (
        <div className="px-3 py-3 border-b border-aria-border">
          <p className="text-xs text-aria-muted uppercase tracking-wider mb-1">Project</p>
          <p className="text-sm font-medium text-aria-text truncate">{project.name}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-aria-muted mb-1">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="h-1 bg-aria-border rounded-full overflow-hidden">
              <div
                className="h-full bg-aria-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-2 space-y-0.5 px-1.5">
        {NAV.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
              activeView === item.view
                ? 'bg-aria-accent/15 text-aria-accent font-medium'
                : 'text-aria-muted hover:text-aria-text hover:bg-aria-card'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="mx-auto mb-3 text-aria-muted hover:text-aria-text transition-colors text-lg"
        title={sidebarCollapsed ? 'Expand' : 'Collapse'}
      >
        {sidebarCollapsed ? '›' : '‹'}
      </button>
    </aside>
  )
}
