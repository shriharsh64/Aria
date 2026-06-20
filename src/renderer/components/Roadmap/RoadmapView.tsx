import React, { useState } from 'react'
import { useProjectStore } from '../../stores/useProjectStore'
import type { Task, TaskStatus, TaskPriority } from '../../stores/useProjectStore'

const STATUS_COLS: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
}
const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'border-aria-border',
  in_progress: 'border-blue-500/40',
  blocked: 'border-aria-error/40',
  done: 'border-aria-success/40'
}
const PRIORITY_BADGE: Record<TaskPriority, string> = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-aria-border text-aria-muted'
}

function TaskCard({ task }: { task: Task }): React.JSX.Element {
  const { updateTask } = useProjectStore()
  const pct = task.estimatedHours > 0
    ? Math.round((task.completedHours / task.estimatedHours) * 100)
    : 0

  return (
    <div className="bg-aria-surface border border-aria-border rounded-xl p-3 space-y-2 cursor-pointer hover:border-aria-accent/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-aria-text leading-snug">{task.title}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-aria-muted leading-relaxed line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-aria-muted bg-aria-card px-1.5 py-0.5 rounded">{task.phase}</span>
        {task.estimatedHours > 0 && (
          <span className="text-xs text-aria-muted ml-auto">{task.estimatedHours}h est.</span>
        )}
      </div>
      {task.estimatedHours > 0 && (
        <div className="h-1 bg-aria-border rounded-full overflow-hidden">
          <div
            className="h-full bg-aria-accent rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {/* Status change */}
      <select
        value={task.status}
        onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-aria-card border border-aria-border rounded text-xs text-aria-muted px-1.5 py-1 focus:outline-none"
      >
        {STATUS_COLS.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  )
}

type ViewMode = 'kanban' | 'timeline'

export default function RoadmapView(): React.JSX.Element {
  const { project } = useProjectStore()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  if (!project) return <div className="p-8 text-aria-muted">No project loaded.</div>

  const tasksByStatus = STATUS_COLS.reduce<Record<TaskStatus, Task[]>>((acc, s) => {
    acc[s] = project.tasks.filter((t) => t.status === s)
    return acc
  }, { todo: [], in_progress: [], blocked: [], done: [] })

  // Group by phase for timeline
  const phases = [...new Set(project.tasks.map((t) => t.phase))].filter(Boolean)
  const tasksByPhase = phases.reduce<Record<string, Task[]>>((acc, p) => {
    acc[p] = project.tasks.filter((t) => t.phase === p)
    return acc
  }, {})

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-aria-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-aria-text">Project Roadmap</h1>
          <p className="text-xs text-aria-muted">{project.tasks.length} tasks · {project.milestones.length} milestones</p>
        </div>
        <div className="flex gap-1 bg-aria-card border border-aria-border rounded-lg p-0.5">
          {(['kanban', 'timeline'] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                viewMode === m ? 'bg-aria-accent text-white' : 'text-aria-muted hover:text-aria-text'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban board */
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {STATUS_COLS.map((status) => (
              <div key={status} className="w-72 flex flex-col gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${STATUS_COLORS[status]} bg-aria-card`}>
                  <span className="text-sm font-medium text-aria-text">{STATUS_LABELS[status]}</span>
                  <span className="ml-auto text-xs text-aria-muted bg-aria-border px-1.5 py-0.5 rounded">
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {tasksByStatus[status].map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className="border border-dashed border-aria-border rounded-xl p-4 text-center text-xs text-aria-muted">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Timeline / phase view */
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {phases.map((phase) => {
            const tasks = tasksByPhase[phase]
            const done = tasks.filter((t) => t.status === 'done').length
            const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
            return (
              <div key={phase} className="bg-aria-card border border-aria-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-aria-text">{phase}</h3>
                  <span className="text-xs text-aria-muted">{done}/{tasks.length} done · {pct}%</span>
                </div>
                <div className="h-1.5 bg-aria-border rounded-full mb-4 overflow-hidden">
                  <div className="h-full bg-aria-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        t.status === 'done' ? 'bg-aria-success' :
                        t.status === 'in_progress' ? 'bg-blue-400' :
                        t.status === 'blocked' ? 'bg-aria-error' : 'bg-aria-border'
                      }`} />
                      <span className={`flex-1 ${t.status === 'done' ? 'line-through text-aria-muted' : 'text-aria-text'}`}>{t.title}</span>
                      <span className={`text-xs ${PRIORITY_BADGE[t.priority]} px-1.5 py-0.5 rounded`}>{t.priority}</span>
                      <span className="text-xs text-aria-muted">{t.estimatedHours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
