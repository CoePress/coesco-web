/**
 * Lazy Loading Utilities
 * Provides components and utilities for code splitting
 */

import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from '@/components/error';

// Loading fallback component for lazy-loaded components
export const LoadingFallback: React.FC<{
    name?: string;
    height?: string;
    showSkeleton?: boolean;
}> = ({
    name = 'Component',
    height = 'h-64',
    showSkeleton = true
}) => {
        if (showSkeleton) {
            return (
                <div className={`animate-pulse ${height} flex flex-col justify-center items-center p-8 bg-gray-50 rounded-lg border border-gray-200`}>
                    <div className="w-8 h-8 bg-gray-300 rounded-full mb-4 animate-spin border-2 border-gray-300 border-t-blue-500"></div>
                    <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
            );
        }

        return (
            <div className={`${height} flex flex-col justify-center items-center`}>
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading {name}...</span>
                </div>
            </div>
        );
    };

// Enhanced error fallback for lazy loading
const LazyLoadErrorFallback: React.FC<{
    error: Error | null;
    resetError: () => void;
    componentName: string;
}> = ({ error, resetError, componentName }) => {
    const isChunkError = error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Loading CSS chunk');

    return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center max-w-md">
                <div className="mb-4">
                    <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                        ⚠️
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        {isChunkError ? 'Loading Error' : 'Component Error'}
                    </h3>
                    <p className="text-red-600 mb-4">
                        {isChunkError
                            ? `Failed to load ${componentName}. This might be due to a network issue or a new version being deployed.`
                            : `There was an error loading the ${componentName} component.`
                        }
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                        onClick={resetError}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
    );
};

// HOC for wrapping lazy components with error boundaries and loading states
export const withLazyLoading = <P extends object>(
    LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
    options: {
        name: string;
        fallbackHeight?: string;
        showSkeleton?: boolean;
    }
) => {
    const WrappedComponent: React.FC<P> = (props) => {
        return (
            <ErrorBoundary
                fallback={(errorProps) => (
                    <LazyLoadErrorFallback
                        {...errorProps}
                        componentName={options.name}
                    />
                )}
                onError={(error, errorInfo) => {
                    console.error(`Lazy loading error for ${options.name}:`, {
                        error,
                        errorInfo,
                        timestamp: new Date().toISOString(),
                    });
                }}
            >
                <Suspense
                    fallback={
                        <LoadingFallback
                            name={options.name}
                            height={options.fallbackHeight}
                            showSkeleton={options.showSkeleton}
                        />
                    }
                >
                    <LazyComponent {...props} />
                </Suspense>
            </ErrorBoundary>
        );
    };

    WrappedComponent.displayName = `withLazyLoading(${options.name})`;
    return WrappedComponent;
};

// Preload utility for eager loading on user interaction
export const preloadComponent = (lazyComponent: React.LazyExoticComponent<any>) => {
    // Trigger the import to start loading
    try {
        // Access the internal promise to start loading
        const component = lazyComponent as any;
        if (component._payload && typeof component._payload === 'function') {
            component._payload();
        }
    } catch (error) {
        console.warn('Failed to preload component:', error);
    }
};

// Hook for preloading components on hover or focus
export const usePreload = (lazyComponent: React.LazyExoticComponent<any>) => {
    const preload = React.useCallback(() => {
        preloadComponent(lazyComponent);
    }, [lazyComponent]);

    return preload;
};

// Utility for creating route-level lazy components
export const createLazyRoute = (
    importFunction: () => Promise<{ default: ComponentType<any> }>,
    componentName: string
) => {
    const LazyComponent = React.lazy(importFunction);

    return withLazyLoading(LazyComponent, {
        name: componentName,
        fallbackHeight: 'min-h-[500px]',
        showSkeleton: true,
    });
};
