/**
 * @file utils/networkStatus.ts
 * @description A singleton utility for monitoring the browser's online/offline status and managing a queue
 * of API calls to be retried upon reconnection.
 */

/** Defines the signature for a callback function that receives network status updates. */
type NetworkCallback = (online: boolean) => void;

/**
 * @class NetworkMonitor
 * @description A class that detects network status changes and provides a mechanism to queue
 * operations for execution when the network is available.
 */
class NetworkMonitor {
    private callbacks: Set<NetworkCallback> = new Set();
    private isOnline: boolean = navigator.onLine;
    private retryQueue: (() => Promise<any>)[] = [];
    
    constructor() {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }
    
    /** Handles the browser's 'online' event, updating state and processing any queued operations. */
    private handleOnline = () => {
        this.isOnline = true;
        this.callbacks.forEach(cb => cb(true));
        this.processRetryQueue();
    };
    
    /** Handles the browser's 'offline' event, updating state. */
    private handleOffline = () => {
        this.isOnline = false;
        this.callbacks.forEach(cb => cb(false));
    };
    
    /**
     * Subscribes a callback function to network status changes.
     * @param {NetworkCallback} callback - The function to call when the network status changes.
     * @returns {() => void} An unsubscribe function.
     */
    public subscribe(callback: NetworkCallback): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    
    /**
     * Gets the current network status.
     * @returns {boolean} True if the browser is online.
     */
    public getStatus(): boolean {
        return this.isOnline;
    }
    
    /**
     * Executes an operation if online, or queues it for later if offline.
     * @template T
     * @param {() => Promise<T>} operation - The async function to execute.
     * @param {string} [errorMessage] - The error message to reject with if queued.
     * @returns {Promise<T>} A promise that resolves with the operation's result or rejects if queued.
     */
    public async executeWithRetry<T>(
        operation: () => Promise<T>,
        errorMessage: string = 'No network connection. Your action will be completed when you reconnect.'
    ): Promise<T> {
        if (!this.isOnline) {
            return new Promise((resolve, reject) => {
                this.retryQueue.push(async () => {
                    try {
                        const result = await operation();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
                reject(new Error(errorMessage));
            });
        }
        
        return operation();
    }
    
    /**
     * Processes all operations in the retry queue.
     */
    private async processRetryQueue() {
        while (this.retryQueue.length > 0 && this.isOnline) {
            const operation = this.retryQueue.shift();
            if (operation) {
                // We don't await here to allow multiple queued operations to start
                operation().catch(console.error);
            }
        }
    }
}

/** A singleton instance of the NetworkMonitor. */
export const networkMonitor = new NetworkMonitor();