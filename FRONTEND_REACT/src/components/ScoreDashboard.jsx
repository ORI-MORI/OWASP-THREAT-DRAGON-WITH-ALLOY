import React, { useMemo, useState, useEffect } from 'react';
import { Shield, CheckCircle, Info } from 'lucide-react';

const ScoreDashboard = ({ nodes, edges, analysisResult, isAnalyzing }) => {
    const [hoveredMetric, setHoveredMetric] = useState(null);
    const [displayedSecurityScore, setDisplayedSecurityScore] = useState(null); // Initialize as null for "Not Analyzed" state

    // Update security score only when a new result is available
    useEffect(() => {
        if (analysisResult && analysisResult.threats) {
            // Count unique threats
            let threatCount = 0;
            const threats = analysisResult.threats;

            // Flatten threats object to count total violations
            Object.values(threats).forEach(violationList => {
                if (Array.isArray(violationList)) {
                    threatCount += violationList.length;
                }
            });

            // Calculate score using a non-linear decay formula to prevent negative values
            // Formula: 100 / (1 + (threatCount * 0.1))
            // 0 threats = 100%
            // 10 threats = 50%
            // 20 threats = 33%
            const score = Math.round(100 / (1 + (threatCount * 0.1)));
            setDisplayedSecurityScore(score);
        }
    }, [analysisResult]);

    // Calculate Modeling Completeness (Connected Node Ratio)
    const completenessData = useMemo(() => {
        // Filter out Zone nodes
        const systemNodes = nodes.filter(n => n.type !== 'zone');

        if (!systemNodes || systemNodes.length === 0) {
            console.log("ScoreDashboard: No system nodes, returning '-'");
            return { ratio: null, text: "-", connected: 0, total: 0 };
        }
        console.log("ScoreDashboard: System nodes exist", systemNodes.length);
        const totalNodes = systemNodes.length;

        // Find all nodes that are connected (source or target of an edge)
        const connectedNodeIds = new Set();
        edges.forEach(edge => {
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        });

        // Count how many of the current system nodes are in the connected set
        let connectedCount = 0;
        systemNodes.forEach(node => {
            if (connectedNodeIds.has(node.id)) {
                connectedCount++;
            }
        });

        const ratio = Math.round((connectedCount / totalNodes) * 100);
        return {
            ratio,
            text: `${connectedCount}/${totalNodes}`,
            connected: connectedCount,
            total: totalNodes
        };
    }, [nodes, edges]);

    // Helper to get color based on score
    const getScoreColor = (score) => {
        if (isAnalyzing) return 'text-blue-600';
        if (score === null) return 'text-gray-400'; // Gray for not analyzed
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (isAnalyzing) return 'bg-blue-50 border-blue-200';
        if (score === null) return 'bg-gray-50 border-gray-200'; // Gray background for not analyzed
        if (score >= 80) return 'bg-green-50 border-green-200';
        if (score >= 50) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    // Helper for completeness color (different thresholds)
    const getCompletenessColor = (ratio) => {
        if (ratio === null) return 'text-gray-400';
        if (ratio >= 90) return 'text-green-600';
        if (ratio >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getCompletenessBg = (ratio) => {
        if (ratio === null) return 'bg-gray-50 border-gray-200';
        if (ratio >= 90) return 'bg-green-50 border-green-200';
        if (ratio >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
            {/* Security Score Card */}
            <div
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-help glass-panel hover:shadow-lg ${getScoreBg(displayedSecurityScore)}`}
                onMouseEnter={() => setHoveredMetric('security')}
                onMouseLeave={() => setHoveredMetric(null)}
            >
                <div className={`p-2 rounded-full bg-white/90 shadow-sm ${getScoreColor(displayedSecurityScore)}`}>
                    <Shield size={20} strokeWidth={2.5} className={isAnalyzing ? 'animate-pulse' : ''} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Security Health</span>
                    <span className={`text-2xl font-black leading-none ${getScoreColor(displayedSecurityScore)}`}>
                        {isAnalyzing ? (
                            <span className="text-lg animate-pulse">Analyzing...</span>
                        ) : displayedSecurityScore === null ? (
                            <span className="text-lg text-gray-400">-</span>
                        ) : (
                            `${displayedSecurityScore}%`
                        )}
                    </span>
                </div>

                {/* Tooltip - Moved to Right */}
                {hoveredMetric === 'security' && (
                    <div className="absolute left-full top-0 ml-3 w-64 p-3 glass-panel bg-gray-900/95 text-white text-xs rounded-xl shadow-2xl z-50 pointer-events-none animate-in fade-in slide-in-from-left-2 backdrop-blur-xl border-gray-700/50">
                        <div className="font-bold mb-1 text-sm flex items-center gap-2 text-indigo-300">
                            <Shield size={14} /> Security Health
                        </div>
                        <p className="leading-relaxed text-gray-300">
                            Indicates the security safety of the network configuration.
                            <br />
                            • <span className="text-green-400">100%</span>: No threats found.
                            <br />
                            • <span className="text-red-400">Lower</span>: Score decreases as threats increase.
                        </p>
                    </div>
                )}
            </div>

            {/* Completeness Card */}
            <div
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-help glass-panel hover:shadow-lg ${getCompletenessBg(completenessData.ratio)}`}
                onMouseEnter={() => setHoveredMetric('completeness')}
                onMouseLeave={() => setHoveredMetric(null)}
            >
                <div className={`p-2 rounded-full bg-white/90 shadow-sm ${getCompletenessColor(completenessData.ratio)}`}>
                    <CheckCircle size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Modeling Completeness</span>
                    <span className={`text-2xl font-black leading-none ${getCompletenessColor(completenessData.ratio)}`}>
                        {completenessData.text}
                    </span>
                </div>

                {/* Tooltip - Moved to Right */}
                {hoveredMetric === 'completeness' && (
                    <div className="absolute left-full top-0 ml-3 w-64 p-3 glass-panel bg-gray-900/95 text-white text-xs rounded-xl shadow-2xl z-50 pointer-events-none animate-in fade-in slide-in-from-left-2 backdrop-blur-xl border-gray-700/50">
                        <div className="font-bold mb-1 text-sm flex items-center gap-2 text-emerald-300">
                            <CheckCircle size={14} /> Completeness
                        </div>
                        <p className="leading-relaxed text-gray-300">
                            Ratio of connected nodes to total nodes.
                            <br />
                            • <span className="text-blue-300">Goal</span>: Connect all nodes.
                            <br />
                            • <span className="text-yellow-400">Tip</span>: Ensure no isolated systems exist.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScoreDashboard;
