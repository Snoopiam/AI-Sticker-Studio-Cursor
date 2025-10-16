/**
 * @file utils/errorTelemetry.ts
 * @description A simple in-memory telemetry service to track and analyze error patterns over time.
 * This helps in automatically detecting systemic issues (like repeated 429s or 500s) and triggering
 * higher-level resilience mechanisms like the global kill switch.
 */

import { apiKillSwitch } from './killSwitch';
import { ET_TIME_WINDOW_MS, ET_RATE_LIMIT_THRESHOLD, ET_SERVER_ERROR_THRESHOLD, ET_TOTAL_ERROR_THRESHOLD, ET_KILL_SWITCH_DURATIONS } from '../constants';

/**
 * @interface ErrorRecord
 * @description Defines the structure for a single recorded error event.
 */
interface ErrorRecord {
    timestamp: number;
    type: string;
    message: string;
    endpoint?: string;
    statusCode?: number;
    context?: any;
}

/**
 * @class ErrorTelemetry
 * @description A class that records errors and analyzes them for recurring patterns.
 */
class ErrorTelemetry {
    private errors: ErrorRecord[] = [];
    private readonly maxErrors = 100;
    private patterns = new Map<string, number>();
    
    /**
     * Records a new error event.
     * @param {any} error - The error object.
     * @param {string} [endpoint] - The name of the function or endpoint where the error occurred.
     * @param {any} [context] - Additional context about the error.
     */
    record(error: any, endpoint?: string, context?: any): void {
        const record: ErrorRecord = {
            timestamp: Date.now(),
            type: error.name || 'Unknown',
            message: error.message || String(error),
            endpoint,
            statusCode: error.status || error.response?.status,
            context
        };
        
        this.errors.push(record);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        this.analyzePatterns();
    }
    
    /**
     * Analyzes recent errors to detect critical patterns and potentially activate the kill switch.
     */
    private analyzePatterns(): void {
        const recentErrors = this.errors.filter(
            e => Date.now() - e.timestamp < ET_TIME_WINDOW_MS
        );
        
        // Count error types
        this.patterns.clear();
        recentErrors.forEach(error => {
            const key = `${error.type}:${error.statusCode || 'unknown'}`;
            this.patterns.set(key, (this.patterns.get(key) || 0) + 1);
        });
        
        // Auto-activate kill switch on critical patterns
        if ((this.patterns.get('Error:429') || 0) >= ET_RATE_LIMIT_THRESHOLD) {
            apiKillSwitch.activate('Rate limit exceeded multiple times. API calls paused.', ET_KILL_SWITCH_DURATIONS.RATE_LIMIT);
        }
        
        if ((this.patterns.get('Error:500') || 0) >= ET_SERVER_ERROR_THRESHOLD) {
            apiKillSwitch.activate('Multiple server errors detected. API calls paused.', ET_KILL_SWITCH_DURATIONS.SERVER_ERROR);
        }
        
        const totalRecent = recentErrors.length;
        if (totalRecent >= ET_TOTAL_ERROR_THRESHOLD) {
            apiKillSwitch.activate(`High error rate: ${totalRecent} errors in 5 minutes. API calls paused.`, ET_KILL_SWITCH_DURATIONS.HIGH_RATE);
        }
    }
    
    /**
     * Gets statistics about the recorded errors.
     * @returns {object} An object containing recent errors, detected patterns, and the error rate.
     */
    getStats(): {
        recentErrors: ErrorRecord[];
        patterns: Record<string, number>;
        errorRate: number;
    } {
        const recentErrors = this.errors.filter(
            e => Date.now() - e.timestamp < 300000
        );
        
        return {
            recentErrors,
            patterns: Object.fromEntries(this.patterns),
            errorRate: recentErrors.length / 5 // per minute
        };
    }
    
    /**
     * Clears all recorded error data.
     */
    clear(): void {
        this.errors = [];
        this.patterns.clear();
    }
}

/** A singleton instance of the ErrorTelemetry service. */
export const errorTelemetry = new ErrorTelemetry();