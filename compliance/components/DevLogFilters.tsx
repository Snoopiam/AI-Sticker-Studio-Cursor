/**
 * @file components/DevLogFilters.tsx
 * @description A component that provides UI controls (select dropdowns, search input)
 * for filtering the development log entries.
 */

import React, { useState, useEffect } from 'react';
import { DevLogType, DevLogImpact } from '../../types/types';

/**
 * @interface DevLogFiltersProps
 * @description Defines the props for the DevLogFilters component.
 */
interface DevLogFiltersProps {
    /** A callback function to notify the parent component of filter changes. */
    onFilterChange: (filters: { type: DevLogType | 'all'; impact: DevLogImpact | 'all'; searchTerm: string }) => void;
}

/** Defines the available options for the log type filter dropdown. */
const typeOptions: (DevLogType | 'all')[] = ['all', 'feature', 'fix', 'refactor', 'enhancement', 'cleanup', 'docs'];
/** Defines the available options for the log impact filter dropdown. */
const impactOptions: (DevLogImpact | 'all')[] = ['all', 'low', 'medium', 'high', 'critical'];

/**
 * @component DevLogFilters
 * @description Renders the filter controls for the development log. It manages its own state
 * for the input fields and uses a debounced useEffect to call the `onFilterChange` prop,
 * preventing excessive re-renders in the parent component during rapid input changes.
 * @param {DevLogFiltersProps} props - Component props.
 */
export const DevLogFilters: React.FC<DevLogFiltersProps> = ({ onFilterChange }) => {
    const [type, setType] = useState<DevLogType | 'all'>('all');
    const [impact, setImpact] = useState<DevLogImpact | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Debounce the filter change callback to improve performance, especially for the search input.
        const handler = setTimeout(() => {
            onFilterChange({ type, impact, searchTerm });
        }, 300);

        // Cleanup function to clear the timeout if the component unmounts or dependencies change.
        return () => {
            clearTimeout(handler);
        };
    }, [type, impact, searchTerm, onFilterChange]);

    const commonSelectClasses = "bg-gray-700 border border-gray-600 rounded-md text-sm text-white focus:ring-purple-500 focus:border-purple-500";

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`flex-grow w-full sm:w-auto ${commonSelectClasses} px-3 py-1.5`}
            />
            <div className="flex gap-3 w-full sm:w-auto">
                 <select value={type} onChange={(e) => setType(e.target.value as DevLogType | 'all')} className={`${commonSelectClasses} px-3 py-1.5`}>
                    <option value="all">All Types</option>
                    {typeOptions.filter(t => t !== 'all').map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <select value={impact} onChange={(e) => setImpact(e.target.value as DevLogImpact | 'all')} className={`${commonSelectClasses} px-3 py-1.5`}>
                    <option value="all">All Impacts</option>
                    {impactOptions.filter(i => i !== 'all').map(i => <option key={i} value={i} className="capitalize">{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                </select>
            </div>
        </div>
    );
};