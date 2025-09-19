/**
 * RFQ-specific Error Boundary
 * Optimized for RFQ form sections with data preservation
 */

import React from 'react';
import ErrorBoundary, { ErrorFallbackProps } from './ErrorBoundary';
import { AlertCircle, Save, RefreshCw, FileText } from 'lucide-react';

interface RFQErrorBoundaryProps {
    children: React.ReactNode;
    sectionName: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    onSaveBeforeReset?: () => void;
    resetKeys?: Array<string | number>;
}

// RFQ-specific fallback UI with data preservation options
const RFQErrorFallback: React.FC<ErrorFallbackProps & {
    sectionName: string;
    onSaveBeforeReset?: () => void;
}> = ({
    error,
    resetError,
    errorId,
    sectionName,
    onSaveBeforeReset,
}) => {
        const handleSafeReset = () => {
            if (onSaveBeforeReset) {
                try {
                    onSaveBeforeReset();
                } catch (saveError) {
                    console.error('Error saving data before reset:', saveError);
                }
            }
            resetError();
        };

        return (
            <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6 my-4">
                <div className="flex items-start space-x-4">
                    <AlertCircle className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />

                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-orange-800 mb-3">
                            Issue with {sectionName}
                        </h3>

                        <div className="space-y-3 text-orange-700">
                            <p>
                                There was a problem loading this section of the RFQ form.
                                Your data in other sections should be safe.
                            </p>

                            {onSaveBeforeReset && (
                                <div className="p-3 bg-orange-100 border border-orange-300 rounded">
                                    <p className="text-sm font-medium text-orange-800 mb-1">
                                        💡 Data Protection Available
                                    </p>
                                    <p className="text-sm text-orange-700">
                                        Click "Save & Reload" to attempt saving your current data before reloading this section.
                                    </p>
                                </div>
                            )}

                            {process.env.NODE_ENV === 'development' && error && (
                                <details className="mt-4">
                                    <summary className="font-medium text-orange-800 cursor-pointer hover:text-orange-900">
                                        🔧 Developer Details
                                    </summary>
                                    <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded text-sm">
                                        <p className="font-medium text-orange-800 mb-1">Error:</p>
                                        <p className="text-orange-700 font-mono text-xs break-all mb-2">
                                            {error.message}
                                        </p>
                                        <p className="text-orange-600 text-xs">
                                            Error ID: {errorId}
                                        </p>
                                        {error.stack && (
                                            <details className="mt-2">
                                                <summary className="text-orange-700 text-xs cursor-pointer">Stack Trace</summary>
                                                <pre className="mt-1 text-xs text-orange-600 overflow-auto max-h-32">
                                                    {error.stack}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </details>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                            {onSaveBeforeReset && (
                                <button
                                    onClick={handleSafeReset}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save & Reload
                                </button>
                            )}

                            <button
                                onClick={resetError}
                                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reload Section
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Refresh Entire Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

const RFQErrorBoundary: React.FC<RFQErrorBoundaryProps> = ({
    children,
    sectionName,
    onError,
    onSaveBeforeReset,
    resetKeys,
}) => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        // Log RFQ-specific error with context
        console.error(`RFQ Section Error in "${sectionName}":`, {
            error,
            errorInfo,
            sectionName,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            formData: 'Available in context', // Don't log actual form data for privacy
        });

        // Attempt to save critical form state to localStorage as backup
        try {
            const currentFormData = sessionStorage.getItem('rfq-form-backup');
            if (currentFormData) {
                const backup = {
                    ...JSON.parse(currentFormData),
                    errorOccurred: {
                        sectionName,
                        timestamp: new Date().toISOString(),
                        errorId: `error_${Date.now()}`,
                    }
                };
                localStorage.setItem('rfq-error-backup', JSON.stringify(backup));
            }
        } catch (backupError) {
            console.warn('Could not create error backup:', backupError);
        }

        // Call custom error handler if provided
        if (onError) {
            onError(error, errorInfo);
        }
    };

    return (
        <ErrorBoundary
            fallback={(props) => (
                <RFQErrorFallback
                    {...props}
                    sectionName={sectionName}
                    onSaveBeforeReset={onSaveBeforeReset}
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

export default RFQErrorBoundary;
