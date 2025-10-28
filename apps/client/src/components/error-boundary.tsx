import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="bg-foreground border border-border rounded-lg shadow-xl max-w-md p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-error">Something went wrong</h2>
              <p className="text-text">We're sorry for the inconvenience. Please try refreshing the page.</p>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-primary text-background rounded hover:opacity-90 transition-opacity font-medium"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-text-muted hover:text-text">Error Details</summary>
                  <pre className="text-xs mt-2 overflow-auto bg-surface p-3 rounded border border-border text-text">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
