/**
 * @file utils/apiSerializer.ts
 * @description Ensures API calls are serialized to prevent bursts that could lead to rate-limiting.
 */
import { API_SERIALIZER_DELAY_MS } from '../constants';

class APISerializer {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    
    async add<T>(operation: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            
            if (!this.processing) {
                this.processQueue();
            }
        });
    }
    
    private async processQueue() {
        if (this.processing) return;
        this.processing = true;
        
        while (this.queue.length > 0) {
            const operation = this.queue.shift();
            if (operation) {
                await operation();
                // Mandatory delay between all API calls to further pace requests.
                await new Promise(resolve => setTimeout(resolve, API_SERIALIZER_DELAY_MS));
            }
        }
        
        this.processing = false;
    }
}

export const apiSerializer = new APISerializer();