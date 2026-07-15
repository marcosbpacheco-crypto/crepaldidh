'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AdminErrorBoundary]', error.message, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Erro ao carregar</h2>
            <p className="text-sm text-slate-500 mb-4">
              Ocorreu um erro ao processar esta página. Tente recarregar.
            </p>
            {this.state.error && (
              <p className="text-[10px] text-red-400 mb-4 font-mono bg-red-50 p-2 rounded-lg text-left break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
