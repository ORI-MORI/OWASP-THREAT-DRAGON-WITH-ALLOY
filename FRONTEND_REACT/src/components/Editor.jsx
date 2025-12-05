import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    useReactFlow,
    useOnSelectionChange,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Home as HomeIcon, Save as SaveIcon, Trash as TrashIcon } from 'lucide-react';

import Sidebar from './Sidebar';
import ZoneNode from './ZoneNode';
import SystemNode from './SystemNode';
import PropertyPanel from './PropertyPanel';
import DataFlowEdge from './DataFlowEdge';
import ScoreDashboard from './ScoreDashboard';
import useStore from '../store';
import { convertGraphToJSON } from '../utils/graphConverter';
import { analyzeGraph } from '../api/analyze';

const nodeTypes = {
    zone: ZoneNode,
    system: SystemNode,
};

const edgeTypes = {
    dataFlow: DataFlowEdge,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const EditorContent = ({ initialData, onExit }) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { project, setViewport, toObject } = useReactFlow();
    const { selectedElement, setSelectedElement } = useStore();
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedThreatId, setSelectedThreatId] = useState(null);

    // Initialization & ID Sync
    useEffect(() => {
        if (initialData) {
            setNodes(initialData.nodes || []);
            setEdges(initialData.edges || []);
            if (initialData.viewport) {
                setViewport(initialData.viewport);
            }

            // Sync ID Counter
            const allIds = [
                ...(initialData.nodes || []).map(n => n.id),
                ...(initialData.edges || []).map(e => e.id)
            ];

            let maxId = 0;
            allIds.forEach(itemId => {
                // Look for patterns like "dndnode_123" or just numbers if any
                const match = itemId.match(/(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxId) {
                        maxId = num;
                    }
                }
            });

            // Set global id to max + 1 to avoid collisions
            id = maxId + 1;
        } else {
            // New Project
            id = 0;
            setNodes([]);
            setEdges([]);
            setViewport({ x: 0, y: 0, zoom: 1 });
        }
    }, [initialData, setNodes, setEdges, setViewport]);

    const handleSave = () => {
        const flow = toObject();
        const data = {
            meta: {
                title: "AMADEUS Project",
                version: "1.0",
                date: new Date().toISOString()
            },
            nodes: flow.nodes,
            edges: flow.edges,
            viewport: flow.viewport
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `amadeus_project_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useOnSelectionChange({
        onChange: ({ nodes, edges }) => {
            if (nodes.length > 0) {
                setSelectedElement(nodes[0]);
            } else if (edges.length > 0) {
                setSelectedElement(edges[0]);
            } else {
                setSelectedElement(null);
            }
        },
    });

    const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, type: 'dataFlow', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }, data: { isBidirectional: true } }, eds)), []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            let defaultType = label;
            let zIndex = 1; // Default z-index for systems

            if (type === 'zone') {
                defaultType = 'Internet'; // Default Zone Type
                zIndex = -1; // Send zones to back
            } else if (type === 'system') {
                if (label === 'PC') defaultType = 'Terminal';
                else if (label === 'Gateway') defaultType = 'NetworkDevice';
                else if (label === 'Server') defaultType = 'Server';
                else if (label === 'Mobile') defaultType = 'Mobile';
                else if (label === 'Security Device') defaultType = 'SecurityDevice';
                else if (label === 'Wireless AP') defaultType = 'WirelessAP';
                else if (label === 'SaaS') defaultType = 'SaaS';
                else defaultType = 'Terminal';
            }

            const isZone = type === 'zone';
            const newNode = {
                id: getId(),
                type,
                position,
                zIndex: isZone ? -1 : 10, // Zones at bottom (-1), Systems on top (10)
                data: { label, grade: 'Open', type: defaultType },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    // Auto-detect Zone on Drag Stop
    const onNodeDragStop = useCallback(
        (event, node) => {
            if (node.type === 'zone') return; // Zones don't need location

            // Calculate node center
            const nodeCenterX = node.position.x + (node.width || 150) / 2;
            const nodeCenterY = node.position.y + (node.height || 40) / 2;

            // Find intersecting zones
            const zones = nodes.filter((n) => n.type === 'zone');
            let foundZone = null;

            for (const zone of zones) {
                const zoneX = zone.position.x;
                const zoneY = zone.position.y;
                const zoneW = zone.width || 100; // Default width if not resized
                const zoneH = zone.height || 100; // Default height if not resized

                if (
                    nodeCenterX >= zoneX &&
                    nodeCenterX <= zoneX + zoneW &&
                    nodeCenterY >= zoneY &&
                    nodeCenterY <= zoneY + zoneH
                ) {
                    foundZone = zone;
                    break; // Assume belonging to the first found zone (nested zones not fully supported yet)
                }
            }

            const newLoc = foundZone ? foundZone.id : '';

            // Update node location if changed
            if (node.data.loc !== newLoc) {
                setNodes((nds) =>
                    nds.map((n) => {
                        if (n.id === node.id) {
                            return { ...n, data: { ...n.data, loc: newLoc } };
                        }
                        return n;
                    })
                );
            }
        },
        [nodes, setNodes]
    );

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const graphData = convertGraphToJSON(nodes, edges);
            const result = await analyzeGraph(graphData);
            setAnalysisResult(result);
            console.log("Analysis Result:", result);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed. See console for details.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear the canvas?')) {
            setNodes([]);
            setEdges([]);
            setAnalysisResult(null);
            id = 0; // Reset ID counter
        }
    };

    const handleThreatClick = (threatId) => {
        setSelectedThreatId(prev => prev === threatId ? null : threatId);
    };

    // Effect to highlight nodes/edges when a threat is selected
    useEffect(() => {
        // Helper update function to avoid infinite loops
        const updateElements = (elements, shouldBeThreatFn) => {
            let hasChanges = false;
            const newElements = elements.map(el => {
                const isThreat = shouldBeThreatFn(el);
                if (!!el.data.isThreat !== isThreat) {
                    hasChanges = true;
                    return { ...el, data: { ...el.data, isThreat } };
                }
                return el;
            });
            return hasChanges ? newElements : elements;
        };

        if (!analysisResult || !selectedThreatId) {
            // Clear highlights safely
            setNodes(nds => updateElements(nds, () => false));
            setEdges(eds => updateElements(eds, () => false));
            return;
        }

        // Helper to sanitize ID consistent with graphConverter
        const sanitizeId = (id) => id.toString().replace(/[^a-zA-Z0-9]/g, '_');

        const isMatch = (elementId, involveSet) => {
            if (!elementId) return false;

            // 0. Absolute Exact Match (Fast path)
            if (involveSet.has(elementId)) return true;

            const cleanId = sanitizeId(elementId);

            // 1. Exact match of sanitized ID
            if (involveSet.has(cleanId)) return true;

            // 2. Match with _return suffix
            if (involveSet.has(cleanId + '_return')) return true;

            // 3. Reverse lookup and Prefix/Suffix matching
            for (const rawThreatId of involveSet) {
                // Strip Alloy Skolem suffixes (e.g., $0)
                let threatId = rawThreatId.split('$')[0].trim();

                if (threatId === elementId) return true;
                if (threatId === cleanId) return true;
                if (threatId.endsWith('_' + cleanId)) return true;
                if (cleanId.endsWith('_' + threatId)) return true;

                // Handle potential path prefixes like "System/dndnode_1"
                if (threatId.includes('/')) {
                    const pathPart = threatId.split('/').pop();
                    if (pathPart === cleanId) return true;
                }
            }
            return false;
        };

        // Parse threatId safely handling hyphens in the key
        const lastDashIndex = selectedThreatId.lastIndexOf('-');
        const threatType = selectedThreatId.substring(0, lastDashIndex);
        const indicesStr = selectedThreatId.substring(lastDashIndex + 1);

        const indices = indicesStr.split(',').map(idx => parseInt(idx, 10));

        const involvedIds = new Set();
        indices.forEach(index => {
            if (!analysisResult.threats || !analysisResult.threats[threatType]) return;
            const threat = analysisResult.threats[threatType][index];
            if (!threat) return;

            if (threat.system) involvedIds.add(threat.system);
            if (threat.connection) involvedIds.add(threat.connection);
        });

        // INFERENCE STEP
        edges.forEach(e => {
            if (isMatch(e.id, involvedIds)) {
                involvedIds.add(e.source);
                involvedIds.add(e.target);
            }
        });

        // Update Nodes
        setNodes((nds) => updateElements(nds, (n) => {
            return isMatch(n.id, involvedIds) || (n.data.label && isMatch(n.data.label, involvedIds));
        }));

        // Update Edges
        setEdges((eds) => updateElements(eds, (e) => {
            return isMatch(e.id, involvedIds);
        }));

    }, [selectedThreatId, analysisResult, setNodes, setEdges, edges]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            <Sidebar />

            {/* Main Canvas Area */}
            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setViewport}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls
                        position="bottom-right"
                        style={{ marginRight: '340px', marginBottom: '16px' }}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg text-gray-600"
                    />
                    <Background variant="dots" gap={20} size={1} color="#cbd5e1" />
                </ReactFlow>
            </div>

            {/* Floating UI Layer */}

            {/* Top Center Actions */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 glass-panel p-1.5 rounded-xl transition-all hover:shadow-md">
                <button
                    onClick={onExit}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    title="Back to Home"
                >
                    <HomeIcon size={16} />
                    Home
                </button>
                <div className="w-px bg-gray-200/50 my-1"></div>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    title="Save Project"
                >
                    <SaveIcon size={16} />
                    Save
                </button>
                <div className="w-px bg-gray-200/50 my-1"></div>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                    <TrashIcon size={16} />
                    Clear
                </button>
                <div className="w-px bg-gray-200/50 my-1"></div>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`px-6 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all ${isAnalyzing
                        ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                        }`}
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Play size={16} fill="currentColor" /> Analyze Threat Model
                        </>
                    )}
                </button>
            </div>

            <ScoreDashboard
                nodes={nodes}
                edges={edges}
                analysisResult={analysisResult}
                isAnalyzing={isAnalyzing}
            />

            <PropertyPanel
                analysisResult={analysisResult}
                onThreatClick={handleThreatClick}
                selectedThreatId={selectedThreatId}
            />
        </div>
    );
};

export default function Editor(props) {
    return (
        <EditorContent {...props} />
    );
}
