/**
 * Performance Page Error Boundary
 * Optimized for performance calculation pages with data recovery
 */

import React from 'react';
import ErrorBoundary, { ErrorFallbackProps } from './error-boundary';
import { Calculator, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface PerformancePageErrorBoundaryProps {
    children: React.ReactNode;
    pageName: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    onRetryCalculation?: () => void;
    resetKeys?: Array<string | number>;
}

// Performance page specific fallback UI
const PerformancePageErrorFallback: React.FC<ErrorFallbackProps & {
    pageName: string;
    onRetryCalculation?: () => void;
}> = ({
    error,
    resetError,
    errorId,
    pageName,
    onRetryCalculation,
}) => {
        const isCalculationError = error?.message?.toLowerCase().includes('calculation') ||
            error?.message?.toLowerCase().includes('math') ||
            error?.message?.toLowerCase().includes('divide') ||
            error?.message?.toLowerCase().includes('infinity');

        const handleRetryCalculation = () => {
            if (onRetryCalculation) {
                try {
                    onRetryCalculation();
                    resetError();
                } catch (retryError) {
                    console.error('Error during calculation retry:', retryError);
                }
            } else {
                resetError();
            }
        };

        return (
            <div className="min-h-[500px] flex items-center justify-center p-8 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg m-4">
                <div className="text-center max-w-lg">
                    <div className="mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Calculator className="h-16 w-16 text-red-400" />
                                <AlertTriangle className="absolute -top-2 -right-2 h-8 w-8 text-red-500" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-red-800 mb-3">
                            {isCalculationError ? 'Calculation Error' : 'Page Error'}
                        </h2>

                        <h3 className="text-lg font-medium text-red-700 mb-4">
                            Issue with {pageName}
                        </h3>
                    </div>

                    <div className="space-y-4 text-red-600 mb-8">
                        {isCalculationError ? (
                            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                                <p className="font-medium text-red-800 mb-2">
                                    ⚠️ Calculation Error Detected
                                </p>
                                <p className="text-sm text-red-700">
                                    There was an issue with the performance calculations. This often happens due to
                                    invalid input values or mathematical constraints. Your data is safe.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg">
                                <p className="font-medium text-orange-800 mb-2">
                                    🔧 Technical Issue
                                </p>
                                <p className="text-sm text-orange-700">
                                    This performance page encountered a technical problem.
                                    Your data should be preserved, but calculations may need to be rerun.
                                </p>
                            </div>
                        )}

                        {process.env.NODE_ENV === 'development' && error && (
                            <details className="text-left">
                                <summary className="font-medium text-red-800 cursor-pointer hover:text-red-900 mb-2">
                                    🔍 Technical Details (Development)
                                </summary>
                                <div className="p-3 bg-red-100 border border-red-300 rounded text-sm">
                                    <p className="font-medium text-red-800 mb-1">Error Message:</p>
                                    <p className="text-red-700 font-mono text-xs break-all mb-3">
                                        {error.message}
                                    </p>
                                    <p className="text-red-600 text-xs mb-2">
                                        Error ID: {errorId}
                                    </p>
                                    {error.stack && (
                                        <details className="mt-2">
                                            <summary className="text-red-700 text-xs cursor-pointer">Full Stack Trace</summary>
                                            <pre className="mt-1 text-xs text-red-600 overflow-auto max-h-40 bg-red-50 p-2 rounded">
                                                {error.stack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </details>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {isCalculationError && onRetryCalculation && (
                            <button
                                onClick={handleRetryCalculation}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Calculator className="mr-2 h-5 w-5" />
                                Retry Calculation
                            </button>
                        )}

                        <button
                            onClick={resetError}
                            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Reload Page
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-sm"
                        >
                            <FileText className="mr-2 h-5 w-5" />
                            Refresh App
                        </button>
                    </div>

                    <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Tip:</strong> If calculations keep failing, check your input values
                            for any extreme numbers or missing required fields.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

const PerformancePageErrorBoundary: React.FC<PerformancePageErrorBoundaryProps> = ({
    children,
    pageName,
    onError,
    onRetryCalculation,
    resetKeys,
}) => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        // Log performance page specific error
        console.error(`Performance Page Error in "${pageName}":`, {
            error,
            errorInfo,
            pageName,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        });

        // Attempt to preserve calculation state
        try {
            const calculationBackup = {
                pageName,
                timestamp: new Date().toISOString(),
                errorMessage: error.message,
                errorStack: error.stack,
                url: window.location.href,
            };
            sessionStorage.setItem(`calculation-error-${pageName}`, JSON.stringify(calculationBackup));
        } catch (backupError) {
            console.warn('Could not create calculation error backup:', backupError);
        }

        // Call custom error handler if provided
        if (onError) {
            onError(error, errorInfo);
        }
    };

    return (
        <ErrorBoundary
            fallback={(props) => (
                <PerformancePageErrorFallback
                    {...props}
                    pageName={pageName}
                    onRetryCalculation={onRetryCalculation}
                />
            )}
            onError={handleError}
            resetKeys={resetKeys}
            resetOnPropsChange={true}
        >
            {children}
        </ErrorBoundary>
    );
};

export default PerformancePageErrorBoundary;
