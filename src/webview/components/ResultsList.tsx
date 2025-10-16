import React from 'react';
import { TableCard } from './TableCard';

interface TableResult {
    id: string;
    name: string;
    fullyQualifiedName: string;
    description?: string;
    tableType?: string;
    columns?: any[];
    rowCount?: number;
    database?: string;
    schema?: string;
    updatedAt?: string;
    tags?: string[];
    aiAnalysis?: string;
}

interface ResultsListProps {
    results: TableResult[];
    loading: boolean;
    searchQuery: string;
    onViewLineage?: (tableFqn: string, tableName: string) => void;
    
}

export const ResultsList: React.FC<ResultsListProps> = ({ 
    results, 
    loading, 
    searchQuery,
    onViewLineage,

}) => {
    if (loading) {
        return (
            <div className="results-section">
                <div className="loading-state">
                    <div className="loading-spinner">🔄</div>
                    <p>Searching OpenMetadata and analyzing with AI...</p>
                </div>
            </div>
        );
    }

    if (!searchQuery && results.length === 0) {
        return (
            <div className="results-section">
                <div className="welcome-state">
                    <h2>🎯 Explore Your Data with AI</h2>
                    <p>Find tables, columns, or simply ask questions about your data catalog.</p>
                    
                    <div className="feature-list">
                        <div className="feature-item">
                            <span className="feature-icon">🔍 Intelligent Search</span>
                            <span className="feature-text">Easily explore and locate data across all your tables.</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🤖 AI-Driven Insights</span>
                            <span className="feature-text">Get smart recommendations and instant analytics powered by AI.</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">📊 Data Quality at a Glance</span>
                            <span className="feature-text">Analyze data consistency, accuracy, and receive improvement suggestions.</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🔗 Understand Your Data Connections</span>
                            <span className="feature-text">Reveal relationships and dependencies between tables.</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (searchQuery && results.length === 0) {
        return (
            <div className="results-section">
                <div className="no-results-state-compact">
                    <div className="no-results-header">
                        <span className="no-results-icon">🔍</span>
                        <span>No results for "{searchQuery}"</span>
                    </div>
                    <div className="quick-actions">
                        <span className="try-label">Try:</span>
                        <button className="suggestion-chip" onClick={() => window.dispatchEvent(new CustomEvent('searchSuggestion', { detail: 'customer' }))}>
                            customer
                        </button>
                        <button className="suggestion-chip" onClick={() => window.dispatchEvent(new CustomEvent('searchSuggestion', { detail: 'order' }))}>
                            order
                        </button>
                        <button className="suggestion-chip" onClick={() => window.dispatchEvent(new CustomEvent('searchSuggestion', { detail: 'user' }))}>
                            user
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="results-section">
            <div className="results-header">
                <h3>Found {results.length} table{results.length !== 1 ? 's' : ''}</h3>
                {searchQuery && (
                    <p>Results for: <strong>"{searchQuery}"</strong></p>
                )}
            </div>
            
            <div className="results-list">
                {results.map((result) => (
                    <TableCard 
                        key={result.id} 
                        table={result}
                        onViewLineage={onViewLineage}
                    />
                ))}
            </div>
        </div>
    );
};