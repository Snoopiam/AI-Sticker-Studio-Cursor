/**
 * @file constants/system.ts
 * @description This file defines system-level constant values for API resilience, such as rate limits,
 * circuit breaker settings, and error telemetry thresholds. Centralizing these values makes the
 * application's resilience strategy easy to configure and maintain.
 */

// --- API Resilience Configuration ---

// Rate Limiter
/** @description The maximum number of tokens the rate limiter bucket can hold. */
export const RL_MAX_TOKENS = 20;
/** @description The number of tokens added to the bucket per second. */
export const RL_REFILL_RATE = 3; // tokens per second

// Circuit Breaker
/** @description The number of consecutive failures required before the circuit breaker trips (opens). */
export const CB_FAILURE_THRESHOLD = 3;
/** @description The duration (in milliseconds) the circuit stays open before transitioning to the 'half-open' state to test for recovery. */
export const CB_TIMEOUT_MS = 60000; // 1 minute

// Error Telemetry & Kill Switch
/** @description The time window (in milliseconds) over which to analyze error patterns. */
export const ET_TIME_WINDOW_MS = 300000; // 5 minutes
/** @description The number of rate limit errors (429) within the time window that will trigger the global kill switch. */
export const ET_RATE_LIMIT_THRESHOLD = 3; // 429s in window
/** @description The number of server errors (500) within the time window that will trigger the global kill switch. */
export const ET_SERVER_ERROR_THRESHOLD = 5; // 500s in window
/** @description The total number of any type of error within the time window that will trigger the global kill switch for a high error rate. */
export const ET_TOTAL_ERROR_THRESHOLD = 15; // total errors in window
/** @description A map of automatic deactivation durations for the kill switch based on the trigger reason. */
export const ET_KILL_SWITCH_DURATIONS = {
    RATE_LIMIT: 600000, // 10 minutes
    SERVER_ERROR: 300000, // 5 minutes
    HIGH_RATE: 180000, // 3 minutes
};

// API Call Pacing
/** @description A mandatory delay (in milliseconds) added by the API serializer between every processed API call to ensure proper pacing. */
export const API_SERIALIZER_DELAY_MS = 200;