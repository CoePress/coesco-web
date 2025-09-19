/**
 * Error Monitoring and Reporting Utilities
 * Provides centralized error tracking and analysis
 */

export interface ErrorReport {
    errorId: string;
    timestamp: string;
    message: string;
    stack?: string;
    componentStack?: string;
    url: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    performanceData?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'calculation' | 'validation' | 'api' | 'rendering' | 'unknown';
    context?: Record<string, any>;
}

export class ErrorMonitor {
    private static instance: ErrorMonitor;
    private errorLog: ErrorReport[] = [];
    private sessionId: string;
    private maxLogSize = 100;

    private constructor() {
        this.sessionId = this.generateSessionId();
        this.initializeGlobalErrorHandling();
    }

    static getInstance(): ErrorMonitor {
        if (!ErrorMonitor.instance) {
            ErrorMonitor.instance = new ErrorMonitor();
        }
        return ErrorMonitor.instance;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private initializeGlobalErrorHandling(): void {
        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.reportError({
                error: event.error || new Error(event.message),
                context: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    type: 'javascript'
                }
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError({
                error: new Error(`Unhandled Promise Rejection: ${event.reason}`),
                context: {
                    reason: event.reason,
                    type: 'promise'
                }
            });
        });
    }

    reportError(options: {
        error: Error;
        errorInfo?: React.ErrorInfo;
        context?: Record<string, any>;
        severity?: ErrorReport['severity'];
        category?: ErrorReport['category'];
    }): string {
        const {
            error,
            errorInfo,
            context = {},
            severity = this.determineSeverity(error),
            category = this.determineCategory(error)
        } = options;

        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const errorReport: ErrorReport = {
            errorId,
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo?.componentStack || undefined,
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            severity,
            category,
            context,
        };

        // Add to local log
        this.errorLog.push(errorReport);

        // Maintain log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // Store in localStorage for persistence
        this.persistErrorLog();

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.group(`🚨 Error Report (${severity.toUpperCase()})`);
            console.error('Error:', error);
            console.log('Error ID:', errorId);
            console.log('Category:', category);
            console.log('Context:', context);
            if (errorInfo) {
                console.log('Component Stack:', errorInfo.componentStack);
            }
            console.groupEnd();
        }

        // Send to monitoring service (in production)
        if (process.env.NODE_ENV === 'production') {
            this.sendToMonitoringService(errorReport);
        }

        return errorId;
    }

    private determineSeverity(error: Error): ErrorReport['severity'] {
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('fetch')) {
            return 'medium';
        }

        if (message.includes('calculation') || message.includes('math')) {
            return 'high';
        }

        if (message.includes('security') || message.includes('permission')) {
            return 'critical';
        }

        if (message.includes('warning') || message.includes('deprecated')) {
            return 'low';
        }

        return 'medium';
    }

    private determineCategory(error: Error): ErrorReport['category'] {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';

        if (message.includes('calculation') || message.includes('math') ||
            message.includes('divide') || message.includes('infinity')) {
            return 'calculation';
        }

        if (message.includes('validation') || message.includes('required') ||
            message.includes('invalid')) {
            return 'validation';
        }

        if (message.includes('fetch') || message.includes('network') ||
            message.includes('api') || message.includes('request')) {
            return 'api';
        }

        if (stack.includes('render') || stack.includes('component') ||
            message.includes('render')) {
            return 'rendering';
        }

        return 'unknown';
    }

    private persistErrorLog(): void {
        try {
            const logData = {
                sessionId: this.sessionId,
                errors: this.errorLog.slice(-20), // Keep last 20 errors
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('error-monitor-log', JSON.stringify(logData));
        } catch (e) {
            console.warn('Could not persist error log:', e);
        }
    }

    private async sendToMonitoringService(errorReport: ErrorReport): Promise<void> {
        try {
            // Placeholder for actual monitoring service integration
            // Could be Sentry, LogRocket, custom endpoint, etc.

            const endpoint = '/api/errors'; // Replace with actual endpoint

            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorReport),
            });
        } catch (e) {
            console.warn('Could not send error to monitoring service:', e);
        }
    }

    getErrorLog(): ErrorReport[] {
        return [...this.errorLog];
    }

    getErrorStats(): {
        total: number;
        bySeverity: Record<string, number>;
        byCategory: Record<string, number>;
        recent: number;
    } {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        const stats = {
            total: this.errorLog.length,
            bySeverity: {} as Record<string, number>,
            byCategory: {} as Record<string, number>,
            recent: 0
        };

        this.errorLog.forEach(error => {
            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

            // Count by category
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;

            // Count recent errors (last hour)
            if (new Date(error.timestamp).getTime() > oneHourAgo) {
                stats.recent++;
            }
        });

        return stats;
    }

    clearErrorLog(): void {
        this.errorLog = [];
        localStorage.removeItem('error-monitor-log');
    }

    exportErrorLog(): string {
        const exportData = {
            sessionId: this.sessionId,
            exportTime: new Date().toISOString(),
            stats: this.getErrorStats(),
            errors: this.errorLog
        };

        return JSON.stringify(exportData, null, 2);
    }
}

// Global error monitor instance
export const errorMonitor = ErrorMonitor.getInstance();

// Utility function for manual error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
    return errorMonitor.reportError({ error, context });
};

// Performance error specific reporter
export const reportPerformanceError = (
    error: Error,
    performanceData?: any,
    calculationType?: string
) => {
    return errorMonitor.reportError({
        error,
        category: 'calculation',
        severity: 'high',
        context: {
            performanceData,
            calculationType,
            timestamp: new Date().toISOString()
        }
    });
};
