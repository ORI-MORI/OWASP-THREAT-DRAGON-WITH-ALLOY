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
import { Play } from 'lucide-react';

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

            const newNode = {
                id: getId(),
                type,
                position,
                zIndex, // Apply z-index
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
        setSelectedThreatId(threatId);
    };

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Home
                </button>
                <div className="w-px bg-gray-200/50 my-1"></div>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    title="Save Project"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save
                </button>
                <div className="w-px bg-gray-200/50 my-1"></div>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
