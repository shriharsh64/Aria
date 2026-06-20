import React, { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '../../stores/useProjectStore'
import type { DirEntry } from '../../src/types'

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
  expanded?: boolean
}

function FileIcon({ isDir, name }: { isDir: boolean; name: string }): React.JSX.Element {
  if (isDir) return <span>📁</span>
  const ext = name.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    md: '📝', txt: '📄', pdf: '📑', py: '🐍', ts: '🔷', tsx: '🔷',
    js: '🟨', json: '📋', csv: '📊', png: '🖼️', jpg: '🖼️', docx: '📃'
  }
  return <span>{icons[ext ?? ''] ?? '📄'}</span>
}

export default function FileManagerView(): React.JSX.Element {
  const { project, updateProject } = useProjectStore()
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')

  const rootPath = project?.projectFolder

  const loadDir = useCallback(async (path: string): Promise<FileNode[]> => {
    const res = await window.aria.listDir(path)
    if (res.error || !res.entries) return []
    return (res.entries as DirEntry[])
      .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__pycache__')
      .map((e) => ({ name: e.name, path: e.path, isDirectory: e.isDirectory }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [])

  useEffect(() => {
    if (!rootPath) return
    setLoading(true)
    loadDir(rootPath).then((n) => { setNodes(n); setLoading(false) })
  }, [rootPath, loadDir])

  const selectFolder = async (): Promise<void> => {
    const path = await window.aria.selectFolder()
    if (path) updateProject({ projectFolder: path })
  }

  const openFile = async (node: FileNode): Promise<void> => {
    if (node.isDirectory) {
      const children = await loadDir(node.path)
      setNodes((prev) => toggleExpand(prev, node.path, children))
      return
    }
    const res = await window.aria.readFile(node.path)
    if (res.content !== undefined) setSelectedFile({ path: node.path, content: res.content })
  }

  const toggleExpand = (nodes: FileNode[], path: string, children: FileNode[]): FileNode[] =>
    nodes.map((n) => {
      if (n.path === path) return { ...n, expanded: !n.expanded, children }
      if (n.children) return { ...n, children: toggleExpand(n.children, path, children) }
      return n
    })

  const analyzeFile = async (): Promise<void> => {
    if (!selectedFile) return
    setAnalyzing(true)
    setAnalysis('')
    const res = await window.aria.apiCall('/files/analyze', {
      path: selectedFile.path,
      content: selectedFile.content.slice(0, 8000),
      project_id: project?.id
    }) as { analysis?: string; error?: string }
    setAnalysis(res?.analysis ?? res?.error ?? 'No analysis returned')
    setAnalyzing(false)
  }

  const TreeNode = ({ node, depth = 0 }: { node: FileNode; depth?: number }): React.JSX.Element => (
    <div>
      <button
        onClick={() => openFile(node)}
        className={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-aria-card transition-colors text-left ${
          selectedFile?.path === node.path ? 'bg-aria-accent/10 text-aria-accent' : 'text-aria-text'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <FileIcon isDir={node.isDirectory} name={node.name} />
        <span className="truncate">{node.name}</span>
        {node.isDirectory && (
          <span className="ml-auto text-aria-muted text-xs">{node.expanded ? '▾' : '▸'}</span>
        )}
      </button>
      {node.expanded && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  )

  return (
    <div className="h-full flex">
      {/* File tree */}
      <div className="w-60 border-r border-aria-border flex flex-col flex-shrink-0">
        <div className="px-3 py-2.5 border-b border-aria-border flex items-center justify-between">
          <span className="text-xs font-medium text-aria-muted uppercase tracking-wider">Files</span>
          <button
            onClick={selectFolder}
            className="text-xs text-aria-accent hover:underline"
          >
            {rootPath ? 'Change' : 'Open folder'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1 px-1">
          {!rootPath && (
            <button
              onClick={selectFolder}
              className="w-full py-4 text-sm text-aria-muted hover:text-aria-text text-center transition-colors"
            >
              📂 Open project folder
            </button>
          )}
          {loading && <p className="text-xs text-aria-muted p-3">Loading...</p>}
          {nodes.map((n) => <TreeNode key={n.path} node={n} />)}
        </div>
      </div>

      {/* File content + analysis */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedFile ? (
          <div className="flex-1 flex items-center justify-center text-center opacity-60">
            <div>
              <span className="text-4xl">📄</span>
              <p className="text-sm text-aria-muted mt-2">Select a file to view and analyze</p>
            </div>
          </div>
        ) : (
          <>
            {/* File header */}
            <div className="border-b border-aria-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-medium text-aria-text truncate">{selectedFile.path.split(/[\\/]/).pop()}</span>
              <button
                onClick={analyzeFile}
                disabled={analyzing}
                className="text-xs bg-aria-accent hover:bg-aria-accent-hover disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors ml-3 flex-shrink-0"
              >
                {analyzing ? 'Analyzing...' : '🤖 Analyze with ARIA'}
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* File content */}
              <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-aria-muted leading-relaxed bg-aria-surface">
                {selectedFile.content}
              </pre>

              {/* Analysis panel */}
              {(analysis || analyzing) && (
                <div className="w-80 border-l border-aria-border p-4 overflow-y-auto flex-shrink-0">
                  <h3 className="text-sm font-semibold text-aria-text mb-3">ARIA Analysis</h3>
                  {analyzing ? (
                    <div className="space-y-2">
                      {[1,2,3].map((i) => (
                        <div key={i} className="h-3 bg-aria-border rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-aria-muted leading-relaxed whitespace-pre-wrap">{analysis}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
