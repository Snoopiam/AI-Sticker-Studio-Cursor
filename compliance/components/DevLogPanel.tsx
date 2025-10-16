/**
 * @file components/DevLogPanel.tsx
 * @description A modal-like panel that displays the application's development log.
 * It includes filtering controls and renders a list of individual log entries.
 */

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DevLogEntry as DevLogEntryType, DevLogType, DevLogImpact, ConfirmationRequest, CreditTransaction } from '../../types/types';
import { DevLogFilters } from './DevLogFilters';
import { DevLogEntry } from './DevLogEntry';

/**
 * @interface DevLogPanelProps
 * @description Defines the props for the DevLogPanel component.
 */
interface DevLogPanelProps {
    onClose: () => void;
}

const INITIAL_VISIBLE_COUNT = 50;


const CreditTransactionEntry: React.FC<{ transaction: CreditTransaction }> = ({ transaction }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const typeColors = {
        deduction: 'text-red-400',
        refund: 'text-green-400',
        grant: 'text-blue-400'
    };

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden text-sm">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/20" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <span className={`font-mono font-semibold w-24 text-right ${typeColors[transaction.type]}`}>
                        {transaction.amount.toFixed(2)}
                    </span>
                    <p className="font-semibold text-white truncate flex-grow">{transaction.reason}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4 text-xs text-gray-400">
                    <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-gray-700/50 bg-gray-900 fade-in text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-gray-400">Transaction ID:</span> <span className="text-gray-200 font-mono truncate">{transaction.id}</span>
                        <span className="text-gray-400">Balance Before:</span> <span className="text-gray-200">{transaction.balanceBefore}</span>
                        <span className="text-gray-400">Balance After:</span> <span className="text-gray-200">{transaction.balanceAfter}</span>
                        <span className="text-gray-400">Type:</span> <span className="text-gray-200 capitalize">{transaction.type}</span>
                    </div>
                    {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <h4 className="font-semibold text-gray-300 mb-1">Metadata:</h4>
                            <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-800/50 p-2 rounded-md">{JSON.stringify(transaction.metadata, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


/**
 * @component DevLogPanel
 * @description The main component for displaying the development log. It manages the state for filters
 * and renders the filtered list of log entries.
 * @param {DevLogPanelProps} props - Component props.
 */
export const DevLogPanel: React.FC<DevLogPanelProps> = ({ onClose }) => {
    const { state, dispatch } = useAppContext();
    const { devLog, creditTransactions } = state;
    const [activeTab, setActiveTab] = useState<'log' | 'credits'>('log');
    
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
    const [filters, setFilters] = useState<{ type: DevLogType | 'all'; impact: DevLogImpact | 'all'; searchTerm: string }>({
        type: 'all',
        impact: 'all',
        searchTerm: '',
    });

    const filteredLogs = useMemo(() => {
        return devLog.filter(log => {
            const typeMatch = filters.type === 'all' || log.type === filters.type;
            const impactMatch = filters.impact === 'all' || log.impact === filters.impact;
            const searchTermMatch = filters.searchTerm === '' ||
                log.summary.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                log.component.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(filters.searchTerm.toLowerCase());
            return typeMatch && impactMatch && searchTermMatch;
        });
    }, [devLog, filters]);
    
    const visibleLogs = useMemo(() => {
        return filteredLogs.slice(0, visibleCount);
    }, [filteredLogs, visibleCount]);
    
    const handleExportDevLog = () => {
        const jsonString = JSON.stringify(devLog, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-sticker-studio-devlog-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

     const handleExportCredits = () => {
        const jsonString = JSON.stringify(creditTransactions, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-sticker-studio-credit-transactions-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteRequest = (id: string) => {
        const request: ConfirmationRequest = {
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this log entry?',
            cost: 0,
            actionType: 'delete-dev-log-entry',
            context: { id }
        };
        dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="devlog-panel-title"
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 id="devlog-panel-title" className="text-xl font-bold text-white font-heading">Dev Tools</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close Dev Log">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex border-b border-gray-700/50 flex-shrink-0">
                    <button onClick={() => setActiveTab('log')} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'log' ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/10' : 'text-gray-400 hover:text-white'}`}>Development Log</button>
                    <button onClick={() => setActiveTab('credits')} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'credits' ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/10' : 'text-gray-400 hover:text-white'}`}>Credit Transactions</button>
                </div>

                {activeTab === 'log' && (
                    <>
                        <div className="p-4 border-b border-gray-700/50 flex-shrink-0 flex justify-between items-center">
                            <DevLogFilters onFilterChange={setFilters} />
                            <button onClick={handleExportDevLog} className="text-sm font-semibold text-purple-300 hover:text-white ml-4">Export JSON</button>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto">
                            {visibleLogs.length > 0 ? (
                                <div className="space-y-3">
                                    {visibleLogs.map(log => (
                                        <DevLogEntry key={log.id} entry={log} onDelete={handleDeleteRequest} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-8">
                                    <p className="font-semibold text-gray-300 mb-2">No Log Entries Found</p>
                                    <p>No development logs match the current filter criteria.</p>
                                </div>
                            )}
                            {filteredLogs.length > visibleCount && (
                                <div className="text-center mt-4">
                                    <button onClick={() => setVisibleCount(prev => prev + 50)} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md">
                                        Load More
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'credits' && (
                    <>
                        <div className="p-4 border-b border-gray-700/50 flex-shrink-0 flex justify-end items-center">
                            <button onClick={handleExportCredits} className="text-sm font-semibold text-purple-300 hover:text-white">Export JSON</button>
                        </div>
                         <div className="flex-grow p-4 overflow-y-auto">
                             {creditTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {creditTransactions.map(tx => (
                                        <CreditTransactionEntry key={tx.id} transaction={tx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-8">
                                    <p className="font-semibold text-gray-300 mb-2">No Transactions Found</p>
                                    <p>Credit transactions will appear here as you use the app.</p>
                                </div>
                            )}
                         </div>
                    </>
                )}

            </div>
        </div>
    );
};