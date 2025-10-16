/**
 * @file utils/rateLimiter.ts
 * @description Concurrency-safe token bucket rate limiter for API calls.
 */

import { RL_MAX_TOKENS, RL_REFILL_RATE } from '../constants';

class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly maxTokens = RL_MAX_TOKENS;
    private readonly refillRate = RL_REFILL_RATE;
    
    // Concurrency control: A queue to serialize acquire requests
    private requestQueue: Array<{
        resolve: () => void;
        tokens: number;
    }> = [];
    private processing = false;
    
    constructor() {
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
    }
    
    /**
     * Acquires a specified number of tokens, waiting if necessary. This method is concurrency-safe.
     * @param {number} [tokensNeeded=1] - The number of tokens to acquire.
     * @returns {Promise<void>} A promise that resolves when the tokens have been acquired.
     */
    async acquire(tokensNeeded: number = 1): Promise<void> {
        return new Promise((resolve) => {
            this.requestQueue.push({ resolve, tokens: tokensNeeded });
            if (!this.processing) {
                this.processQueue();
            }
        });
    }
    
    /**
     * Processes the queue of token requests one by one to prevent race conditions.
     */
    private async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;
        
        while (this.requestQueue.length > 0) {
            this.refill();
            
            const request = this.requestQueue[0];
            if (!request) break;
            
            // Wait if not enough tokens
            while (this.tokens < request.tokens) {
                const deficit = request.tokens - this.tokens;
                const waitTime = (deficit / this.refillRate) * 1000;
                
                if (waitTime > 100) {
                    console.log(`Rate limit: waiting ${Math.round(waitTime)}ms for ${request.tokens} tokens`);
                }
                
                // Wait for a minimum of 50ms, or slightly longer than the calculated wait time, capped to avoid long blocks.
                await new Promise(r => setTimeout(r, Math.min(waitTime + 50, 500)));
                this.refill();
            }
            
            // Atomic token deduction and request resolution
            this.tokens -= request.tokens;
            const completedRequest = this.requestQueue.shift();
            completedRequest?.resolve();
            
            // Introduce a small, mandatory delay between processing queued requests to further pace the API calls.
            await new Promise(r => setTimeout(r, 100));
        }
        
        this.processing = false;
    }
    
    /**
     * Adds tokens to the bucket based on the elapsed time since the last refill.
     */
    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        if (elapsed < 0.001) return;

        const tokensToAdd = elapsed * this.refillRate;
        
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    
    /**
     * Returns the number of currently available tokens.
     * @returns {number} The number of available tokens.
     */
    getAvailableTokens(): number {
        this.refill();
        return Math.floor(this.tokens);
    }

    /**
     * Calculates the estimated wait time in milliseconds to acquire a certain number of tokens.
     * @param {number} tokens - The number of tokens to acquire.
     * @returns {number} The estimated wait time in milliseconds.
     */
     public waitTimeFor(tokens: number): number {
        this.refill();
        if (this.tokens >= tokens) return 0;
        return ((tokens - this.tokens) / this.refillRate) * 1000;
    }
}

export const rateLimiter = new RateLimiter();