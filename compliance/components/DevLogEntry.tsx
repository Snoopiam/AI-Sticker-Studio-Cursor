/**
 * @file components/DevLogEntry.tsx
 * @description A component that displays a single entry in the development log.
 * It includes badges for type and impact and can be expanded to show more details.
 */

import React, { useState } from 'react';
import { DevLogEntry as DevLogEntryType } from '../../types/types';

/**
 * @interface DevLogEntryProps
 * @description Defines the props for the DevLogEntry component.
 */
interface DevLogEntryProps {
    entry: DevLogEntryType;
    onDelete: (id: string) => void;
}

/**
 * @component TypeBadge
 * @description A small, color-coded badge to display the type of a log entry (e.g., 'feature', 'fix').
 */
const TypeBadge: React.FC<{ type: DevLogEntryType['type'] }> = ({ type }) => {
    const colors: Record<DevLogEntryType['type'], string> = {
        feature: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        fix: 'bg-red-500/20 text-red-300 border-red-500/50',
        refactor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        enhancement: 'bg-green-500/20 text-green-300 border-green-500/50',
        cleanup: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
        docs: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors[type]}`}>{type}</span>;
};

/**
 * @component ImpactBadge
 * @description A small, color-coded badge to display the impact level of a log entry (e.g., 'critical', 'low').
 */
const ImpactBadge: React.FC<{ impact: DevLogEntryType['impact'] }> = ({ impact }) => {
     const colors: Record<DevLogEntryType['impact'], string> = {
        low: 'text-gray-300',
        medium: 'text-yellow-300',
        high: 'text-orange-400',
        critical: 'text-red-400',
    };
    return <span className={`font-semibold text-xs ${colors[impact]}`}>{impact.toUpperCase()}</span>;
};

/**
 * @component DevLogEntry
 * @description Renders a single, expandable log entry. The header is always visible,
 * and clicking it toggles the visibility of the detailed information.
 * @param {DevLogEntryProps} props - Component props.
 */
export const DevLogEntry: React.FC<DevLogEntryProps> = ({ entry, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/20" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <TypeBadge type={entry.type} />
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-white truncate">{entry.summary}</p>
                        <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleDateString()} &middot; {entry.component}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                     <ImpactBadge impact={entry.impact} />
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </div>
            {isExpanded && (
                <div className="relative p-4 border-t border-gray-700/50 bg-gray-900 fade-in">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 rounded-full hover:bg-red-900/50 hover:text-red-400"
                        title="Delete this entry"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="prose prose-sm prose-invert max-w-none">
                        <h4 className="font-semibold text-gray-200">Details:</h4>
                        <pre className="text-xs whitespace-pre-wrap font-sans bg-gray-800/50 p-3 rounded-md">{entry.details}</pre>
                        
                        <h4 className="font-semibold text-gray-200 mt-4">Files Changed:</h4>
                        <ul className="text-xs">
                            {entry.filesChanged.map((file, index) => (
                                <li key={index}><code className="text-purple-300 bg-gray-800/50 px-1 py-0.5 rounded">{file}</code></li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};