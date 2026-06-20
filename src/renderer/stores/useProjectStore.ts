import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// zustand v5 compatible

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  phase: string
  dependencies: string[]
  estimatedHours: number
  completedHours: number
  dueDate?: string
  tags: string[]
  ariaAssessment?: string
}

export interface Milestone {
  id: string
  title: string
  date: string
  done: boolean
}

export interface Project {
  id: string
  name: string
  problemStatement: string
  scope: string
  domain: string
  teamSize: number
  deadline?: string
  projectFolder?: string
  createdAt: string
  tasks: Task[]
  milestones: Milestone[]
  overallProgress: number
  skillGaps: string[]
  suggestedTools: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  agentType?: string
  attachments?: { name: string; path: string; type: string }[]
}

export interface ProjectStore {
  // Project
  project: Project | null
  setProject: (p: Project) => void
  updateProject: (partial: Partial<Project>) => void

  // Tasks
  updateTask: (taskId: string, partial: Partial<Task>) => void
  addTask: (task: Task) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void

  // UI state
  activeView: 'chat' | 'dashboard' | 'roadmap' | 'research' | 'files' | 'papers'
  setActiveView: (v: ProjectStore['activeView']) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Sidecar status
  sidecarReady: boolean
  setSidecarReady: (v: boolean) => void
  apiKeySet: boolean
  setApiKeySet: (v: boolean) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      project: null,
      setProject: (p) => set({ project: p }),
      updateProject: (partial) =>
        set((s) => ({ project: s.project ? { ...s.project, ...partial } : s.project })),

      updateTask: (taskId, partial) =>
        set((s) => ({
          project: s.project
            ? {
                ...s.project,
                tasks: s.project.tasks.map((t) =>
                  t.id === taskId ? { ...t, ...partial } : t
                )
              }
            : null
        })),

      addTask: (task) =>
        set((s) => ({
          project: s.project
            ? { ...s.project, tasks: [...s.project.tasks, task] }
            : null
        })),

      messages: [],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [] }),

      activeView: 'chat',
      setActiveView: (v) => set({ activeView: v }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      sidecarReady: false,
      setSidecarReady: (v) => set({ sidecarReady: v }),
      apiKeySet: false,
      setApiKeySet: (v) => set({ apiKeySet: v })
    }),
    {
      name: 'aria-project-store',
      partialize: (s) => ({ project: s.project, apiKeySet: s.apiKeySet })
    }
  )
)
