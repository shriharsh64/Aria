import React from 'react'

interface Props {
  sidecarReady: boolean
}

export default function TitleBar({ sidecarReady }: Props): React.JSX.Element {
  return (
    <div className="drag-region h-10 bg-aria-surface border-b border-aria-border flex items-center px-4 flex-shrink-0">
      {/* App identity */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-5 h-5 rounded bg-aria-accent flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-sm font-semibold text-aria-text">ARIA</span>
        <span className="text-xs text-aria-muted">Autonomous Research & Innovation Agent</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sidecar status */}
      <div className="no-drag flex items-center gap-1.5 mr-4">
        <div className={`w-1.5 h-1.5 rounded-full ${sidecarReady ? 'bg-aria-success' : 'bg-aria-warning animate-pulse'}`} />
        <span className="text-xs text-aria-muted">{sidecarReady ? 'Agent ready' : 'Starting...'}</span>
      </div>

      {/* Window controls */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={() => window.aria?.minimize()}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
          title="Minimize"
        />
        <button
          onClick={() => window.aria?.maximize()}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
          title="Maximize"
        />
        <button
          onClick={() => window.aria?.close()}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
          title="Close"
        />
      </div>
    </div>
  )
}
