/**
 * @file utils/requestDedup.ts
 * @description A utility to prevent identical, concurrent API requests from being sent multiple times.
 * If the same request is made while a previous one is still in-flight, the duplicate request will
 * simply await the result of the original, saving API calls and credits.
 */

/**
 * @class RequestDeduplicator
 * @description Manages pending requests to prevent duplicates.
 */
class RequestDeduplicator {
    private pending = new Map<string, Promise<any>>();
    
    /**
     * Executes an operation, preventing duplicates based on a provided key.
     * @template T
     * @param {string} key - A unique key identifying the request.
     * @param {() => Promise<T>} operation - The async function to execute if no duplicate is found.
     * @returns {Promise<T>} A promise that resolves with the result of the operation.
     */
    async execute<T>(
        key: string,
        operation: () => Promise<T>
    ): Promise<T> {
        // Check for pending request with same key
        if (this.pending.has(key)) {
            console.log(`Duplicate request prevented: ${key}`);
            return this.pending.get(key)!;
        }
        
        // Create and store promise, ensuring it's removed from the map once it settles.
        const promise = operation()
            .finally(() => this.pending.delete(key));
        
        this.pending.set(key, promise);
        return promise;
    }
    
    /**
     * Generates a unique key for a request based on its type and parameters.
     * @param {string} type - A string identifying the type of the request (e.g., 'generateStickers').
     * @param {any} params - An object of parameters for the request.
     * @returns {string} A unique key string.
     */
    generateKey(type: string, params: any): string {
        try {
            const normalized = JSON.stringify(params, Object.keys(params).sort());
            return `${type}:${this.hash(normalized)}`;
        } catch (e) {
            // Fallback for circular structures or other stringify errors
            return `${type}:${Date.now()}`;
        }
    }
    
    /**
     * A simple, non-crypto hash function to create a short key from a string.
     * @param {string} str - The string to hash.
     * @returns {string} The hashed string.
     */
    private hash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
}

/** A singleton instance of the RequestDeduplicator. */
export const requestDedup = new RequestDeduplicator();