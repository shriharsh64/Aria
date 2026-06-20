import React, { useState } from 'react'
import { useProjectStore } from '../../stores/useProjectStore'

interface PatentResult {
  patent_number: string
  title: string
  abstract: string
  assignee: string
  date: string
  url: string
  similarity_score?: number
}

interface ResearchState {
  loading: boolean
  results: PatentResult[]
  summary: string
  error: string
}

export default function ResearchView(): React.JSX.Element {
  const { project, sidecarReady } = useProjectStore()
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ResearchState>({ loading: false, results: [], summary: '', error: '' })
  const [activeTab, setActiveTab] = useState<'patent' | 'literature'>('patent')

  const runPatentSearch = async (): Promise<void> => {
    const q = query.trim() || project?.problemStatement || ''
    if (!q) return
    setState((s) => ({ ...s, loading: true, error: '' }))
    const res = await window.aria.apiCall('/research/patent', {
      query: q,
      project_id: project?.id
    }) as { results?: PatentResult[]; summary?: string; error?: string }
    setState({
      loading: false,
      results: res?.results ?? [],
      summary: res?.summary ?? '',
      error: res?.error ?? ''
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-aria-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-aria-text">Research</h1>
          <p className="text-xs text-aria-muted">Patent search · Prior art · Literature</p>
        </div>
        <div className="flex gap-1 bg-aria-card border border-aria-border rounded-lg p-0.5">
          {(['patent', 'literature'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                activeTab === t ? 'bg-aria-accent text-white' : 'text-aria-muted hover:text-aria-text'
              }`}
            >
              {t === 'patent' ? '⚖️ Patents' : '📚 Literature'}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-6 py-4 border-b border-aria-border flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPatentSearch()}
            placeholder={project?.problemStatement ? 'Searching based on your problem statement...' : 'Enter search query...'}
            className="flex-1 bg-aria-card border border-aria-border rounded-lg px-3 py-2.5 text-sm text-aria-text placeholder-aria-muted focus:outline-none focus:border-aria-accent transition-colors"
          />
          <button
            onClick={runPatentSearch}
            disabled={state.loading || !sidecarReady}
            className="px-4 py-2.5 bg-aria-accent hover:bg-aria-accent-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {state.loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {project?.problemStatement && (
          <p className="text-xs text-aria-muted mt-1.5">
            Auto-query from problem statement: <em>"{project.problemStatement.slice(0, 80)}..."</em>
          </p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {state.error && (
          <div className="bg-aria-error/10 border border-aria-error/30 rounded-xl p-4 text-sm text-aria-error">
            {state.error}
          </div>
        )}

        {state.summary && (
          <div className="bg-aria-card border border-aria-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-aria-text mb-2">ARIA's Assessment</h3>
            <p className="text-sm text-aria-muted leading-relaxed">{state.summary}</p>
          </div>
        )}

        {state.loading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-aria-card border border-aria-border rounded-xl p-4 space-y-2 animate-pulse">
                <div className="h-4 bg-aria-border rounded w-3/4" />
                <div className="h-3 bg-aria-border rounded w-1/2" />
                <div className="h-3 bg-aria-border rounded w-full" />
                <div className="h-3 bg-aria-border rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!state.loading && state.results.length === 0 && !state.error && (
          <div className="text-center py-16 space-y-3 opacity-60">
            <span className="text-4xl">⚖️</span>
            <p className="text-sm text-aria-muted">Search USPTO patents to check for prior art and IP conflicts.</p>
            <p className="text-xs text-aria-muted">ARIA will analyze results and give a risk assessment.</p>
          </div>
        )}

        {state.results.map((r) => (
          <div key={r.patent_number} className="bg-aria-card border border-aria-border rounded-xl p-4 space-y-2 hover:border-aria-accent/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-aria-text leading-snug">{r.title}</h3>
              {r.similarity_score !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                  r.similarity_score > 0.7 ? 'bg-aria-error/15 text-aria-error' :
                  r.similarity_score > 0.4 ? 'bg-aria-warning/15 text-aria-warning' :
                  'bg-aria-success/15 text-aria-success'
                }`}>
                  {Math.round(r.similarity_score * 100)}% similar
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-aria-muted">
              <span>#{r.patent_number}</span>
              {r.assignee && <span>· {r.assignee}</span>}
              {r.date && <span>· {r.date}</span>}
            </div>
            <p className="text-xs text-aria-muted leading-relaxed line-clamp-3">{r.abstract}</p>
            {r.url && (
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); /* open external via shell */ }}
                className="text-xs text-aria-accent hover:underline"
              >
                View patent →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
