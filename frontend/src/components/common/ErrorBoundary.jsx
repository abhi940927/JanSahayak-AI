import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              JanSahayak AI encountered an unexpected rendering error. You can reload the page or return to the main portal.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-white text-sm font-semibold rounded-lg shadow transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>

            {this.state.error && (
              <details className="mt-4 text-left border-t border-slate-200 pt-3">
                <summary className="text-xs text-slate-500 font-semibold cursor-pointer hover:text-slate-800">
                  Technical Details
                </summary>
                <div className="mt-2 p-2.5 bg-slate-100 rounded text-[11px] font-mono text-red-700 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
