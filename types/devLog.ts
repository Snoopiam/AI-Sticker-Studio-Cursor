/**
 * @file types/devLog.ts
 * @description Contains TypeScript types and interfaces related to the development log feature.
 */

/** Defines the type of change a log entry represents. */
export type DevLogType = 'feature' | 'fix' | 'refactor' | 'enhancement' | 'cleanup' | 'docs';
/** Defines the severity or importance of a log entry. */
export type DevLogImpact = 'low' | 'medium' | 'high' | 'critical';

/**
 * @interface DevLogEntry
 * @description Defines the structure for a single entry in the development log.
 */
export interface DevLogEntry {
    /** A unique identifier for the log entry. */
    id: string;
    /** The timestamp of the change in ISO 8601 format. */
    timestamp: string;
    /** The type of the change. */
    type: DevLogType;
    /** The primary component or area of the app affected. */
    component: string;
    /** A concise, one-line summary of the change. */
    summary: string;
    /** A more detailed description of the change, which can include markdown. */
    details: string;
    /** A list of the main files that were modified. */
    filesChanged: string[];
    /** The assessed impact of the change. */
    impact: DevLogImpact;
}