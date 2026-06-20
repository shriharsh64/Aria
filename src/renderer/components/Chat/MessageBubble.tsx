import React, { useState } from 'react'
import type { ChatMessage } from '../../stores/useProjectStore'

interface Props {
  message: ChatMessage
}

const AGENT_LABELS: Record<string, string> = {
  problem: 'Problem Agent',
  ideation: 'Ideation Agent',
  planning: 'Planning Agent',
  research: 'Research Agent',
  patent: 'Patent Agent',
  writing: 'Writing Agent',
  progress: 'Progress Agent',
  skill: 'Skill Agent',
  auto: 'ARIA'
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l|p])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

export default function MessageBubble({ message }: Props): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const copy = (): void => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-aria-error bg-aria-error/10 px-3 py-1 rounded-full">{message.content}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 animate-fadeIn ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm ${
          isUser ? 'bg-aria-accent/30' : 'bg-aria-accent/20'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`group relative max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Agent label */}
        {!isUser && message.agentType && (
          <span className="text-xs text-aria-accent ml-1">
            {AGENT_LABELS[message.agentType] ?? 'ARIA'}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-aria-accent text-white rounded-tr-none'
              : 'bg-aria-card border border-aria-border text-aria-text rounded-tl-none'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              className="prose-aria"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}

          {/* Attachments */}
          {message.attachments?.map((att) => (
            <div key={att.path} className="mt-2 flex items-center gap-1.5 text-xs opacity-70">
              <span>📎</span><span>{att.name}</span>
            </div>
          ))}
        </div>

        {/* Copy button */}
        <button
          onClick={copy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-aria-muted hover:text-aria-text ml-1"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>

        {/* Timestamp */}
        <span className="text-xs text-aria-muted ml-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
