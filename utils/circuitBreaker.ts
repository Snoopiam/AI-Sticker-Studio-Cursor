/**
 * @file utils/circuitBreaker.ts
 * @description Implements the circuit breaker pattern to prevent an application from repeatedly
 * trying to execute an operation that is likely to fail. This helps prevent cascading failures
 * and gives a failing service time to recover.
 */

import { apiKillSwitch } from './killSwitch';
import { CB_FAILURE_THRESHOLD, CB_TIMEOUT_MS } from '../constants';

/**
 * @interface CircuitState
 * @description Defines the structure for the state of a single circuit.
 */
interface CircuitState {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
}

/**
 * @class CircuitBreaker
 * @description A class that manages multiple named circuits.
 */
class CircuitBreaker {
    private circuits = new Map<string, CircuitState>();
    /** The number of failures required to trip the circuit. */
    private readonly threshold = CB_FAILURE_THRESHOLD;
    /** The duration in milliseconds the circuit stays open before moving to half-open. */
    private readonly timeout = CB_TIMEOUT_MS;
    
    /**
     * Executes an operation, wrapping it in the circuit breaker logic.
     * @template T
     * @param {string} circuitName - The unique name for this circuit (e.g., 'generateStickers').
     * @param {() => Promise<T>} operation - The async function to execute.
     * @returns {Promise<T>} A promise that resolves with the operation's result or rejects if the circuit is open or the operation fails.
     */
    async execute<T>(
        circuitName: string,
        operation: () => Promise<T>
    ): Promise<T> {
        const circuit = this.getCircuit(circuitName);
        
        if (circuit.state === 'open') {
            if (Date.now() - circuit.lastFailure > this.timeout) {
                circuit.state = 'half-open';
            } else {
                throw new Error(`Circuit for '${circuitName}' is open. Service temporarily disabled to prevent further errors.`);
            }
        }
        
        try {
            const result = await operation();
            this.onSuccess(circuitName);
            return result;
        } catch (error) {
            this.onFailure(circuitName);
            throw error;
        }
    }
    
    /**
     * Retrieves or creates the state for a named circuit.
     * @param {string} name - The name of the circuit.
     * @returns {CircuitState} The state object for the circuit.
     */
    private getCircuit(name: string): CircuitState {
        if (!this.circuits.has(name)) {
            this.circuits.set(name, {
                failures: 0,
                lastFailure: 0,
                state: 'closed'
            });
        }
        return this.circuits.get(name)!;
    }
    
    /**
     * Resets a circuit to the 'closed' state after a successful operation.
     * @param {string} circuitName - The name of the circuit.
     */
    onSuccess(circuitName: string): void {
        const circuit = this.getCircuit(circuitName);
        circuit.failures = 0;
        circuit.state = 'closed';
    }
    
    /**
     * Records a failure for a circuit. If the failure threshold is reached, the circuit is opened.
     * @param {string} circuitName - The name of the circuit.
     */
    private onFailure(circuitName: string): void {
        const circuit = this.getCircuit(circuitName);
        circuit.failures++;
        circuit.lastFailure = Date.now();
        
        if (circuit.failures >= this.threshold) {
            circuit.state = 'open';
            console.error(`Circuit ${circuitName} opened after ${this.threshold} failures.`);
            
            // Activate kill switch if multiple circuits are open
            const openCircuits = Array.from(this.circuits.values())
                .filter(c => c.state === 'open').length;
            
            if (openCircuits >= 2) {
                apiKillSwitch.activate('Multiple service failures detected. API calls paused.', 300000); // 5 min
            }
        }
    }
    
    /**
     * Gets the current status of all managed circuits.
     * @returns {Record<string, CircuitState>} An object mapping circuit names to their states.
     */
    getStatus(): Record<string, CircuitState> {
        const status: Record<string, CircuitState> = {};
        this.circuits.forEach((state, name) => {
            status[name] = { ...state };
        });
        return status;
    }
}

/** A singleton instance of the CircuitBreaker. */
export const circuitBreaker = new CircuitBreaker();