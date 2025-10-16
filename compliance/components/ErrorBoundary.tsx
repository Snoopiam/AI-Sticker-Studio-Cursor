/**
 * @file components/ErrorBoundary.tsx
 * @description A React error boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the entire application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * @interface Props
 * @description Defines the props for the ErrorBoundary component.
 */
interface Props {
    children: ReactNode;
}

/**
 * @interface State
 * @description Defines the state for the ErrorBoundary component.
 */
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * @class ErrorBoundary
 * @description Error boundary component that provides graceful error handling for the application.
 */
export class ErrorBoundary extends Component<Props, State> {
    // A modern class property initializer for state, replacing the constructor.
    state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    /**
     * A lifecycle method that updates the state to indicate an error has occurred,
     * which triggers the rendering of the fallback UI.
     * @param {Error} error - The error that was thrown.
     * @returns {Partial<State>} An object to update the state.
     */
    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    /**
     * A lifecycle method that is called after an error has been thrown by a descendant component.
     * It receives the error and information about which component threw the error.
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - An object with a `componentStack` key containing information about which component threw the error.
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Application Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        
        this.setState({ errorInfo });
        
        // Optional: Send to error tracking service in production
        if (window.location.hostname !== 'localhost') {
            // Future: Sentry, LogRocket, etc.
        }
    }

    /**
     * Resets the error boundary's state, attempting to re-render the child components.
     */
    handleReset = () => {
        // Reset error boundary state to retry rendering.
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null 
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-red-400">
                                Something Went Wrong
                            </h2>
                        </div>
                        
                        <p className="text-gray-300 mb-4">
                            The application encountered an unexpected error. Your work has been automatically saved.
                        </p>
                        
                        <details className="mb-4 text-xs text-gray-400 bg-gray-900 rounded p-3">
                            <summary className="cursor-pointer hover:text-gray-200 font-semibold">
                                Technical Details
                            </summary>
                            <pre className="mt-2 overflow-auto max-h-48 text-[10px] leading-relaxed">
                                {this.state.error?.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                            >
                                Reload App
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}