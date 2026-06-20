import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useProjectStore } from '../../stores/useProjectStore'
import type { ChatMessage } from '../../stores/useProjectStore'
import MessageBubble from './MessageBubble'
import AgentSelector from './AgentSelector'

export type AgentMode =
  | 'auto'
  | 'problem'
  | 'ideation'
  | 'planning'
  | 'research'
  | 'patent'
  | 'writing'
  | 'progress'
  | 'skill'

export default function ChatView(): React.JSX.Element {
  const { messages, addMessage, project, sidecarReady } = useProjectStore()
  const [input, setInput] = useState('')
  const [agentMode, setAgentMode] = useState<AgentMode>('auto')
  const [isThinking, setIsThinking] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{ name: string; path: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || isThinking || !sidecarReady) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments: attachedFile ? [{ name: attachedFile.name, path: attachedFile.path, type: 'file' }] : undefined
    }
    addMessage(userMsg)
    setInput('')
    setAttachedFile(null)
    setIsThinking(true)

    try {
      const res = await window.aria.apiCall('/chat', {
        message: text,
        agent_mode: agentMode,
        project_id: project?.id,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        attachment_path: attachedFile?.path
      }) as { response?: string; agent_used?: string; error?: string }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res?.response ?? res?.error ?? 'No response',
        timestamp: new Date().toISOString(),
        agentType: res?.agent_used
      }
      addMessage(assistantMsg)
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${String(err)}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsThinking(false)
    }
  }, [input, isThinking, sidecarReady, agentMode, project, messages, addMessage, attachedFile])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const attachFile = async (): Promise<void> => {
    const path = await window.aria.selectFile()
    if (path) {
      const name = path.split(/[\\/]/).pop() ?? path
      setAttachedFile({ name, path })
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Agent selector bar */}
      <div className="border-b border-aria-border px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-aria-muted">Mode:</span>
        <AgentSelector value={agentMode} onChange={setAgentMode} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className="w-16 h-16 rounded-2xl bg-aria-accent/20 flex items-center justify-center">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <p className="text-base font-medium text-aria-text">ARIA is ready</p>
              <p className="text-sm text-aria-muted mt-1">Ask anything about your project — research, planning, patents, papers, or code.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              {[
                'Refine my problem statement',
                'Generate a patent search report',
                'What tasks should I prioritize today?',
                'Draft the methodology section'
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-xs text-aria-muted bg-aria-card border border-aria-border rounded-lg px-3 py-2 hover:border-aria-accent hover:text-aria-text transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isThinking && (
          <div className="flex items-start gap-3 animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-aria-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">🤖</span>
            </div>
            <div className="bg-aria-card border border-aria-border rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-aria-accent rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-aria-accent rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-aria-accent rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-aria-border p-4">
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 bg-aria-card border border-aria-border rounded-lg px-3 py-1.5">
            <span className="text-xs">📎</span>
            <span className="text-xs text-aria-muted truncate flex-1">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-aria-muted hover:text-aria-error text-xs">✕</button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <button
            onClick={attachFile}
            className="p-2.5 text-aria-muted hover:text-aria-text hover:bg-aria-card rounded-lg transition-colors flex-shrink-0"
            title="Attach file"
          >
            📎
          </button>
          <div className="flex-1 bg-aria-card border border-aria-border rounded-xl focus-within:border-aria-accent transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={sidecarReady ? `Ask ARIA anything... (${agentMode} mode)` : 'Starting agent...'}
              disabled={!sidecarReady}
              className="w-full bg-transparent px-4 py-3 text-sm text-aria-text placeholder-aria-muted focus:outline-none resize-none max-h-32"
              style={{ minHeight: '44px' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || isThinking || !sidecarReady}
            className="p-2.5 bg-aria-accent hover:bg-aria-accent-hover disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
            title="Send (Enter)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-aria-muted mt-1.5 ml-1">Enter to send · Shift+Enter for newline · Attach files for ARIA to analyze</p>
      </div>
    </div>
  )
}
