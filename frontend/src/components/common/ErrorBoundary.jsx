import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Button from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught unhandled React error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 shadow-lg">
            <AlertTriangle className="w-10 h-10 mx-auto" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Something went wrong loading this view
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {this.state.error?.message ||
                'An unexpected error occurred while rendering the workspace component.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              className="text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry Action
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                window.location.href = '/learn';
              }}
              className="text-xs font-semibold"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" /> Return to Practice Labs
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
