import React from 'react'
import type { AgentMode } from './ChatView'

interface Props {
  value: AgentMode
  onChange: (mode: AgentMode) => void
}

const MODES: { value: AgentMode; label: string; icon: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', icon: '🤖', desc: 'ARIA picks the best agent' },
  { value: 'problem', label: 'Problem', icon: '🎯', desc: 'Refine problem statement' },
  { value: 'ideation', label: 'Ideation', icon: '💡', desc: 'Brainstorm & explore ideas' },
  { value: 'planning', label: 'Planning', icon: '🗺️', desc: 'Roadmap & task planning' },
  { value: 'research', label: 'Research', icon: '🔬', desc: 'Literature & domain research' },
  { value: 'patent', label: 'Patent', icon: '⚖️', desc: 'Prior art & IP analysis' },
  { value: 'writing', label: 'Paper', icon: '📄', desc: 'Research paper drafting' },
  { value: 'progress', label: 'Progress', icon: '📊', desc: 'Assess & report progress' },
  { value: 'skill', label: 'Skills', icon: '🎓', desc: 'Learning & skill gaps' }
]

export default function AgentSelector({ value, onChange }: Props): React.JSX.Element {
  return (
    <div className="flex gap-1 flex-wrap">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          title={m.desc}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
            value === m.value
              ? 'bg-aria-accent text-white font-medium'
              : 'text-aria-muted hover:text-aria-text hover:bg-aria-card'
          }`}
        >
          <span>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
