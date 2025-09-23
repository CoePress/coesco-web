/**
 * Section-specific Error Boundary
 * Optimized for form sections and data components
 */

import React from 'react';
import ErrorBoundary, { ErrorFallbackProps } from './error-boundary';
import { AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface SectionErrorBoundaryProps {
    children: React.ReactNode;
    sectionName: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    resetKeys?: Array<string | number>;
}

// Section-specific fallback UI
const SectionErrorFallback: React.FC<ErrorFallbackProps & { sectionName: string }> = ({
    error,
    resetError,
    errorId,
    sectionName,
}) => {
    return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-6 my-4">
            <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />

                <div className="flex-1">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                        Error in {sectionName}
                    </h3>

                    <p className="text-red-600 mb-4">
                        This section encountered an error and couldn't load properly.
                        Other sections should continue to work normally.
                    </p>

                    {process.env.NODE_ENV === 'development' && error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-sm">
                            <p className="font-medium text-red-800 mb-1">Technical Details:</p>
                            <p className="text-red-700 font-mono text-xs break-all mb-2">
                                {error.message}
                            </p>
                            <p className="text-red-600 text-xs">
                                Error ID: {errorId}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={resetError}
                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reload Section
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({
    children,
    sectionName,
    onError,
    resetKeys,
}) => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        // Log section-specific error
        console.error(`Error in section "${sectionName}":`, {
            error,
            errorInfo,
            sectionName,
            timestamp: new Date().toISOString(),
        });

        // Call custom error handler if provided
        if (onError) {
            onError(error, errorInfo);
        }
    };

    return (
        <ErrorBoundary
            fallback={(props) => <SectionErrorFallback {...props} sectionName={sectionName} />}
            onError={handleError}
            resetKeys={resetKeys}
            resetOnPropsChange={true}
        >
            {children}
        </ErrorBoundary>
    );
};

export default SectionErrorBoundary;
