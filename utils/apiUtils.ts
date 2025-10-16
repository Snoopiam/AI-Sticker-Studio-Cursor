/**
 * @file utils/apiUtils.ts
 * @description Provides utility functions for making resilient API calls, including
 * rate limiting, circuit breaking, automatic retries, and request deduplication.
 */

import { apiKillSwitch } from './killSwitch';
import { circuitBreaker } from './circuitBreaker';
import { rateLimiter } from './rateLimiter';
import { errorTelemetry } from './errorTelemetry';
import { requestDedup } from './requestDedup';

/**
 * Checks if an error is likely a transient, retryable error from the Gemini API.
 * @param {any} error - The error object to check.
 * @returns {boolean} True if the error is retryable.
 */
const isRetryableError = (error: any): boolean => {
    // Check for HTTP status codes that indicate transient issues
    if (error?.status === 429 || error?.status === 503 || error?.status === 500) {
        return true;
    }
    
    // Check for response status from fetch errors
    if (error?.response?.status === 429 || error?.response?.status === 503) {
        return true;
    }
    
    // Check common error messages for retryable conditions
    if (error && typeof error.message === 'string') {
        const message = error.message.toLowerCase();
        const retryablePatterns = [
            'resource_exhausted', 'rate limit', 'quota', 'internal error', 'service unavailable',
            '503', '429', 'too many requests', 'temporarily unavailable',
            'service is currently experiencing high traffic', 'network error'
        ];
        return retryablePatterns.some(pattern => message.includes(pattern));
    }
    
    // Check for Google API specific error codes
    const googleApiErrorCode = error?.errorInfo?.code || error?.code;
    if (googleApiErrorCode === 'RESOURCE_EXHAUSTED' || googleApiErrorCode === 'UNAVAILABLE' ||
        googleApiErrorCode === 8 /* RESOURCE_EXHAUSTED numeric */ ||
        googleApiErrorCode === 14 /* UNAVAILABLE numeric */) {
        return true;
    }
    
    return false;
};

/**
 * A utility that wraps an async function with exponential backoff retry logic.
 * @template T
 * @param {() => Promise<T>} fn - The async function to execute.
 * @param {object} [options] - Configuration for the retry logic.
 * @returns {Promise<T>} A promise that resolves with the result of the function if successful.
 */
const withRetry = async <T>(
    fn: () => Promise<T>,
    options: { retries?: number; delay?: number; onRetry?: (attempt: number, delay: number) => void } = {}
): Promise<T> => {
    const { retries = 3, delay = 2000, onRetry } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (isRetryableError(error) && attempt < retries) {
                const retryDelay = delay * Math.pow(2, attempt - 1);
                if (onRetry) {
                    onRetry(attempt, retryDelay);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                throw error; // Re-throw the last error or non-retryable errors
            }
        }
    }
    throw new Error('Retry logic failed unexpectedly.');
};

/**
 * A comprehensive wrapper for all API calls that orchestrates the entire resilience suite.
 * @template T
 * @param {() => Promise<T>} operation - The core async API function to execute.
 * @param {object} options - Configuration options for the resilience layers.
 * @param {string} options.circuitName - A unique name for the circuit breaker.
 * @param {string} [options.dedupKey] - An optional key for request deduplication.
 * @param {number} [options.rateLimitTokens=1] - The number of tokens this call consumes from the rate limiter.
 * @returns {Promise<T>} A promise that resolves with the result of the operation.
 */
export const safeApiCall = async <T>(
    operation: () => Promise<T>,
    options: {
        circuitName: string;
        dedupKey?: string;
        rateLimitTokens?: number;
        retries?: number;
        delay?: number;
        onRetry?: (attempt: number, delay: number) => void;
    }
): Promise<T> => {
    // 1. Pre-flight check: Global kill switch
    apiKillSwitch.check();
    
    // 2. Rate limiting: Wait for tokens if necessary
    if (options.rateLimitTokens !== 0) {
        const tokensToAcquire = options.rateLimitTokens || 1;
        const waitTime = rateLimiter.waitTimeFor(tokensToAcquire);
        if (waitTime > 0) {
            console.log(`Waiting ${Math.round(waitTime)}ms for rate limit tokens...`);
        }
        await rateLimiter.acquire(tokensToAcquire);
    }
    
    // 3. Deduplication wrapper: Return existing promise if a duplicate is in-flight
    const dedupOperation = async () => {
        // 4. Circuit breaker wrapper: Check if the specific service is healthy
        return circuitBreaker.execute(options.circuitName, async () => {
            // 5. Retry logic: Handle transient errors automatically
            return withRetry(operation, {
                retries: options.retries,
                delay: options.delay,
                onRetry: options.onRetry
            });
        });
    };
    
    try {
        const finalOperation = options.dedupKey 
            ? () => requestDedup.execute(options.dedupKey!, dedupOperation)
            : dedupOperation;
        
        const result = await finalOperation();
        // Manually reset circuit breaker on success, especially for half-open state
        circuitBreaker.onSuccess(options.circuitName);
        return result;

    } catch (error) {
        // 6. Telemetry: Record the error for pattern analysis
        errorTelemetry.record(error, options.circuitName);
        throw error; // Re-throw the error to be handled by the application logic
    }
};

// Re-exporting requestDedup for use in other parts of the app if needed
export { requestDedup };