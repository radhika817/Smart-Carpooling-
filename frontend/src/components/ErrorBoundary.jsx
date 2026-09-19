import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-slate-200 my-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Something went wrong in this section</h3>
              <p className="text-xs text-red-300/80 mt-0.5">
                {this.state.error?.message || 'An unexpected rendering error occurred'}
              </p>
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
