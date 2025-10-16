/**
 * @file utils/killSwitch.ts
 * @description A global emergency stop ("kill switch") for all API operations. This is a critical safety
 * mechanism to halt all outgoing requests during a major service outage or when critical error patterns are detected,
 * preventing users from wasting credits on failing calls.
 */

/**
 * @interface KillSwitchState
 * @description Defines the structure of the kill switch's state object.
 */
interface KillSwitchState {
    active: boolean;
    reason: string;
    activatedAt: number;
    autoReactivateAt?: number;
}

/**
 * @class APIKillSwitch
 * @description A singleton class that manages the state of the global API kill switch.
 */
class APIKillSwitch {
    private state: KillSwitchState = {
        active: false,
        reason: '',
        activatedAt: 0
    };
    private listeners: Set<(state: KillSwitchState) => void> = new Set();
    private reactivateTimer?: ReturnType<typeof setTimeout>;
    
    /**
     * Activates the kill switch, blocking all subsequent API calls.
     * @param {string} reason - The reason for activating the switch, displayed to the user.
     * @param {number} [autoReactivateAfterMs] - Optional. If provided, the switch will automatically deactivate after this many milliseconds.
     */
    activate(reason: string, autoReactivateAfterMs?: number): void {
        if (this.state.active) return; // Prevent multiple activations
        this.state = {
            active: true,
            reason,
            activatedAt: Date.now(),
            autoReactivateAt: autoReactivateAfterMs ? Date.now() + autoReactivateAfterMs : undefined
        };
        
        console.error(`🛑 API KILL SWITCH ACTIVATED: ${reason}`);
        this.notifyListeners();
        
        if (autoReactivateAfterMs) {
            if (this.reactivateTimer) clearTimeout(this.reactivateTimer);
            this.reactivateTimer = setTimeout(() => this.deactivate(), autoReactivateAfterMs);
        }
    }
    
    /**
     * Deactivates the kill switch, allowing API calls to resume.
     */
    deactivate(): void {
        if (!this.state.active) return;
        if (this.reactivateTimer) clearTimeout(this.reactivateTimer);
        this.state.active = false;
        console.log('✅ API Kill Switch deactivated');
        this.notifyListeners();
    }
    
    /**
     * Checks if the kill switch is active. If it is, this method throws an error,
     * effectively blocking the execution of an API call.
     * This should be called at the beginning of any API wrapper function.
     */
    check(): void {
        if (this.state.active) {
            const error = new Error(`API blocked by kill switch: ${this.state.reason}`);
            (error as any).killSwitch = true;
            throw error;
        }
    }
    
    /**
     * Subscribes a listener function to changes in the kill switch state.
     * @param {function} listener - The callback function to execute when the state changes.
     * @returns {function} An unsubscribe function.
     */
    subscribe(listener: (state: KillSwitchState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    /** Notifies all subscribed listeners of a state change. */
    private notifyListeners(): void {
        this.listeners.forEach(fn => fn(this.state));
    }
    
    /**
     * Gets the current state of the kill switch.
     * @returns {KillSwitchState} A copy of the current state.
     */
    getState(): KillSwitchState {
        return { ...this.state };
    }
}

/** A singleton instance of the APIKillSwitch. */
export const apiKillSwitch = new APIKillSwitch();