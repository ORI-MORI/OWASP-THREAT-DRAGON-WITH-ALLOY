import React, { useState } from 'react';
import { ChevronUp, ChevronDown, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AnalysisPanel({ result, onClose }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!result) return null;

    const { total_count, threats } = result;
    const hasViolations = total_count > 0;

    return (
        <div
            className={`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-20 flex flex-col ${isCollapsed ? 'h-12' : 'h-1/3 min-h-[200px] max-h-[50vh]'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0 h-12">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {hasViolations ? (
                            <AlertTriangle className="text-red-600" size={20} />
                        ) : (
                            <CheckCircle className="text-green-600" size={20} />
                        )}
                        <h3 className={`font-bold ${hasViolations ? 'text-red-700' : 'text-green-700'}`}>
                            Analysis Results
                        </h3>
                    </div>
                    {hasViolations && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {total_count} Violation{total_count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                    {!hasViolations ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <CheckCircle size={48} className="text-green-500 mb-2" />
                            <p className="text-lg font-medium text-green-700">No security violations found.</p>
                            <p className="text-sm">Your system design appears to be secure based on current rules.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(threats).map(([key, items]) => {
                                if (items.length === 0) return null;
                                return (
                                    <div key={key} className="border border-red-100 rounded-lg overflow-hidden">
                                        <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <h4 className="font-semibold text-red-900 text-sm uppercase tracking-wide">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h4>
                                            <span className="ml-auto text-xs text-red-600 font-medium">
                                                {items.length} issue{items.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="p-3 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                                                    <ul className="space-y-1">
                                                        {Object.entries(item).map(([k, v]) => (
                                                            <li key={k} className="flex items-start gap-2">
                                                                <span className="font-medium text-gray-900 min-w-[100px]">{k}:</span>
                                                                <span className="text-gray-600 break-all">{v}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
