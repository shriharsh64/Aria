import React from 'react'
import { useProjectStore } from '../../stores/useProjectStore'
import type { Task } from '../../stores/useProjectStore'

const STATUS_COLORS = {
  todo: 'text-aria-muted bg-aria-border',
  in_progress: 'text-blue-400 bg-blue-400/10',
  blocked: 'text-aria-error bg-aria-error/10',
  done: 'text-aria-success bg-aria-success/10'
}

const PRIORITY_COLORS = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-aria-muted'
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }): React.JSX.Element {
  return (
    <div className="bg-aria-card border border-aria-border rounded-xl p-4">
      <p className="text-xs text-aria-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold text-aria-text">{value}</p>
      {sub && <p className="text-xs text-aria-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function TaskRow({ task }: { task: Task }): React.JSX.Element {
  const { updateTask } = useProjectStore()
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-aria-border last:border-0">
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={(e) => updateTask(task.id, { status: e.target.checked ? 'done' : 'in_progress' })}
        className="accent-aria-accent flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-aria-muted' : 'text-aria-text'}`}>
          {task.title}
        </p>
        <p className="text-xs text-aria-muted truncate">{task.phase}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
        {task.status.replace('_', ' ')}
      </span>
      <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
        {task.priority}
      </span>
    </div>
  )
}

export default function Dashboard(): React.JSX.Element {
  const { project, setActiveView } = useProjectStore()
  if (!project) return <div className="p-8 text-aria-muted">No project loaded.</div>

  const total = project.tasks.length
  const done = project.tasks.filter((t) => t.status === 'done').length
  const inProgress = project.tasks.filter((t) => t.status === 'in_progress').length
  const blocked = project.tasks.filter((t) => t.status === 'blocked').length
  const critical = project.tasks.filter((t) => t.priority === 'critical' && t.status !== 'done')
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  // Upcoming milestones
  const upcoming = project.milestones.filter((m) => !m.done).slice(0, 3)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-aria-text">{project.name}</h1>
        <p className="text-sm text-aria-muted mt-0.5">{project.domain} · Team of {project.teamSize}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Overall Progress" value={`${progress}%`} sub={`${done} of ${total} tasks done`} />
        <StatCard label="In Progress" value={inProgress} sub="active tasks" />
        <StatCard label="Blocked" value={blocked} sub="need attention" />
        <StatCard label="Deadline" value={project.deadline ?? 'Not set'} sub={project.deadline ? 'days remaining' : ''} />
      </div>

      {/* Progress bar */}
      <div className="bg-aria-card border border-aria-border rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-aria-text">Project Progress</span>
          <span className="text-aria-muted">{progress}%</span>
        </div>
        <div className="h-2 bg-aria-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-aria-accent to-purple-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-aria-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aria-success inline-block" />Done: {done}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />In Progress: {inProgress}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aria-error inline-block" />Blocked: {blocked}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aria-border inline-block" />Todo: {total - done - inProgress - blocked}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Critical tasks */}
        <div className="bg-aria-card border border-aria-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-aria-text">Critical Tasks</h2>
            <button onClick={() => setActiveView('roadmap')} className="text-xs text-aria-accent hover:underline">View all</button>
          </div>
          {critical.length === 0 ? (
            <p className="text-sm text-aria-muted">No critical tasks pending.</p>
          ) : (
            critical.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </div>

        {/* Milestones */}
        <div className="bg-aria-card border border-aria-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-aria-text mb-3">Upcoming Milestones</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-aria-muted">All milestones completed!</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-aria-accent flex-shrink-0" />
                  <span className="text-sm text-aria-text flex-1">{m.title}</span>
                  <span className="text-xs text-aria-muted">{m.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All tasks */}
      <div className="bg-aria-card border border-aria-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-aria-text mb-3">All Tasks</h2>
        {project.tasks.length === 0 ? (
          <p className="text-sm text-aria-muted">No tasks yet. Ask ARIA to generate your roadmap.</p>
        ) : (
          project.tasks.map((t) => <TaskRow key={t.id} task={t} />)
        )}
      </div>

      {/* Suggested tools & skill gaps */}
      {(project.suggestedTools.length > 0 || project.skillGaps.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {project.suggestedTools.length > 0 && (
            <div className="bg-aria-card border border-aria-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-aria-text mb-3">Suggested Tools</h2>
              <div className="flex flex-wrap gap-1.5">
                {project.suggestedTools.map((t) => (
                  <span key={t} className="text-xs bg-aria-accent/10 text-aria-accent border border-aria-accent/20 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}
          {project.skillGaps.length > 0 && (
            <div className="bg-aria-card border border-aria-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-aria-text mb-3">Skill Gaps</h2>
              <div className="flex flex-wrap gap-1.5">
                {project.skillGaps.map((s) => (
                  <span key={s} className="text-xs bg-aria-warning/10 text-aria-warning border border-aria-warning/20 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
