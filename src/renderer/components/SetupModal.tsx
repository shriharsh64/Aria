import React, { useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import type { Project } from '../stores/useProjectStore'

type Step = 'apikey' | 'project' | 'generating'

export default function SetupModal(): React.JSX.Element {
  const { setProject, setApiKeySet } = useProjectStore()
  const [step, setStep] = useState<Step>('apikey')
  const [apiKey, setApiKey] = useState('')
  const [form, setForm] = useState({
    name: '',
    idea: '',
    domain: '',
    deadline: '',
    teamSize: '1'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApiKey = async (): Promise<void> => {
    if (!apiKey.trim().startsWith('AIza')) {
      setError('Key should start with AIza')
      return
    }
    setError('')
    // Store key in sidecar
    const res = await window.aria.apiCall('/config/apikey', { key: apiKey.trim() }) as { ok?: boolean; error?: string }
    if (res?.error) { setError(res.error); return }
    setApiKeySet(true)
    setStep('project')
  }

  const handleCreateProject = async (): Promise<void> => {
    if (!form.name || !form.idea) { setError('Name and idea are required'); return }
    setError('')
    setLoading(true)
    setStep('generating')

    const res = await window.aria.apiCall('/project/init', {
      name: form.name,
      idea: form.idea,
      domain: form.domain,
      deadline: form.deadline,
      team_size: parseInt(form.teamSize)
    }) as { project?: Project; error?: string }

    setLoading(false)
    if (res?.error) { setError(res.error); setStep('project'); return }
    if (res?.project) setProject(res.project)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-aria-bg">
      <div className="w-full max-w-lg bg-aria-card border border-aria-border rounded-2xl p-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-aria-accent flex items-center justify-center">
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-aria-text">Welcome to ARIA</h1>
            <p className="text-sm text-aria-muted">Autonomous Research & Innovation Agent</p>
          </div>
        </div>

        {/* Step: API Key */}
        {(step === 'apikey') && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-aria-text block mb-1.5">Google API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApiKey()}
                placeholder="AIzaSy..."
                className="w-full bg-aria-surface border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text placeholder-aria-muted focus:outline-none focus:border-aria-accent transition-colors font-mono"
              />
              <p className="text-xs text-aria-muted mt-1.5">Stored locally only. Never leaves your machine.</p>
            </div>
            {error && <p className="text-sm text-aria-error">{error}</p>}
            <button
              onClick={handleApiKey}
              className="w-full bg-aria-accent hover:bg-aria-accent-hover text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Project Details */}
        {step === 'project' && (
          <div className="space-y-4">
            <p className="text-sm text-aria-muted">Tell ARIA about your project. The more detail you provide, the better the roadmap.</p>
            <div>
              <label className="text-xs font-medium text-aria-muted uppercase tracking-wider block mb-1">Project Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. SmartCrop — AI-powered precision agriculture"
                className="w-full bg-aria-surface border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text placeholder-aria-muted focus:outline-none focus:border-aria-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-aria-muted uppercase tracking-wider block mb-1">Project Idea / Problem</label>
              <textarea
                value={form.idea}
                onChange={(e) => setForm({ ...form, idea: e.target.value })}
                rows={4}
                placeholder="Describe your idea and the problem you're solving in plain language..."
                className="w-full bg-aria-surface border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text placeholder-aria-muted focus:outline-none focus:border-aria-accent transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-aria-muted uppercase tracking-wider block mb-1">Domain</label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full bg-aria-surface border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text focus:outline-none focus:border-aria-accent transition-colors"
                >
                  <option value="">Select...</option>
                  <option value="AI/ML">AI / ML</option>
                  <option value="Web/App">Web / App</option>
                  <option value="Hardware/IoT">Hardware / IoT</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Environment">Environment</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-aria-muted uppercase tracking-wider block mb-1">Team Size</label>
                <select
                  value={form.teamSize}
                  onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                  className="w-full bg-aria-surface border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text focus:outline-none focus:border-aria-accent transition-colors"
                >
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-aria-muted uppercase tracking-wider block mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full bg-aria-surface border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text focus:outline-none focus:border-aria-accent transition-colors"
              />
            </div>
            {error && <p className="text-sm text-aria-error">{error}</p>}
            <button
              onClick={handleCreateProject}
              disabled={loading}
              className="w-full bg-aria-accent hover:bg-aria-accent-hover disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Generate Project Plan with ARIA
            </button>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center gap-1.5">
              <div className="w-2 h-2 bg-aria-accent rounded-full typing-dot" />
              <div className="w-2 h-2 bg-aria-accent rounded-full typing-dot" />
              <div className="w-2 h-2 bg-aria-accent rounded-full typing-dot" />
            </div>
            <p className="text-sm text-aria-muted">ARIA is analyzing your idea and building your project plan...</p>
            <p className="text-xs text-aria-muted">Generating problem statement, roadmap, tasks, and milestones</p>
            {error && <p className="text-sm text-aria-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
