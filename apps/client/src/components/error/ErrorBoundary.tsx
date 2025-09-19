/**
 * Base Error Boundary Component
 * Provides comprehensive error handling for React components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: React.ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number>;
}

export interface ErrorFallbackProps {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    resetError: () => void;
    errorId: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private resetTimeoutId: number | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Generate unique error ID for tracking
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            hasError: true,
            error,
            errorId,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            errorInfo,
        });

        // Log error for monitoring/debugging
        console.error('Error Boundary caught an error:', {
            error,
            errorInfo,
            errorId: this.state.errorId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // In development, show additional debug info
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Debug Info');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Component Stack:', errorInfo.componentStack);
            console.groupEnd();
        }
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        const { resetOnPropsChange, resetKeys } = this.props;
        const { hasError } = this.state;

        // Auto-reset on props change if enabled
        if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
            this.resetError();
        }

        // Reset on resetKeys change
        if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
            this.resetError();
        }
    }

    resetError = () => {
        // Clear any pending reset timeout
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
            this.resetTimeoutId = null;
        }

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
        });
    };

    render() {
        const { hasError, error, errorInfo, errorId } = this.state;
        const { children, fallback: CustomFallback } = this.props;

        if (hasError) {
            // Use custom fallback if provided
            if (CustomFallback) {
                return (
                    <CustomFallback
                        error={error}
                        errorInfo={errorInfo}
                        resetError={this.resetError}
                        errorId={errorId}
                    />
                );
            }

            // Default fallback UI
            return <DefaultErrorFallback
                error={error}
                errorInfo={errorInfo}
                resetError={this.resetError}
                errorId={errorId}
            />;
        }

        return children;
    }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetError,
    errorId,
}) => {
    const copyErrorToClipboard = () => {
        const errorDetails = {
            errorId,
            message: error?.message,
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
        };

        navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
            .then(() => alert('Error details copied to clipboard'))
            .catch(() => console.error('Failed to copy error details'));
    };

    return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center max-w-md">
                <div className="mb-4">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                </div>

                <h2 className="text-xl font-semibold text-red-800 mb-2">
                    Something went wrong
                </h2>

                <p className="text-red-600 mb-6">
                    An unexpected error occurred. You can try refreshing the section or go back to safety.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-left text-sm">
                        <p className="font-medium text-red-800 mb-1">Error Details:</p>
                        <p className="text-red-700 font-mono text-xs break-all">
                            {error?.message}
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                            Error ID: {errorId}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={resetError}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Go Home
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <button
                            onClick={copyErrorToClipboard}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            <Bug className="mr-2 h-4 w-4" />
                            Copy Error
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;
