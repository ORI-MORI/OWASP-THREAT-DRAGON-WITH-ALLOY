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

const EditorContent = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { project } = useReactFlow();
    const { selectedElement, setSelectedElement } = useStore();
    const [analysisResult, setAnalysisResult] = useState(null);

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

                // Sync selectedElement if it's the dragged node
                // We use useStore.getState().selectedElement to get the latest value if needed, 
                // but here we rely on the closure or the hook. 
                // Since onNodeDragStop depends on [nodes, setNodes], and selectedElement changes often,
                // we should probably add selectedElement to dependency or use functional update.
                // However, simply checking ID match is safe.
                if (selectedElement && selectedElement.id === node.id) {
                    setSelectedElement({
                        ...node,
                        data: { ...node.data, loc: newLoc }
                    });
                }
            }
        },
        [nodes, setNodes, selectedElement, setSelectedElement]
    );

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [idMapping, setIdMapping] = useState(null);
    const [focusedPath, setFocusedPath] = useState(new Set());
    const [selectedThreatId, setSelectedThreatId] = useState(null); // Format: "type-index"

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        // Reset styles but PRESERVE dimensions (width, height) and zIndex
        setNodes((nds) => nds.map((n) => {
            const { border, boxShadow, borderRadius, ...preservedStyle } = n.style || {};
            return { ...n, style: preservedStyle };
        }));
        setEdges((eds) => eds.map((e) => ({ ...e, style: {}, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' } })));
        setAnalysisResult(null);
        setFocusedPath(new Set());
        setSelectedThreatId(null);

        try {
            const payload = convertGraphToJSON(nodes, edges);
            setIdMapping(payload._mapping); // Save mapping for later use
            console.log('Payload:', payload);

            const result = await analyzeGraph(payload);
            console.log('Result:', result);

            if (result.success) {
                setAnalysisResult(result.result);

                // Highlighting Logic (Initial Red for all violations)
                const violatingIds = new Set();
                const threats = result.result.threats;

                Object.values(threats).flat().forEach(violation => {
                    Object.values(violation).forEach(val => {
                        if (!val) return;
                        const match = val.match(/(System|Connection)[^0-9]*(\d+)/);
                        if (match) {
                            const type = match[1] === 'System' ? 'systems' : 'connections';
                            const id = parseInt(match[2]);
                            const item = payload._mapping[type].find(i => i.id == id);
                            if (item) {
                                violatingIds.add(item.realId);
                            }
                        }
                    });
                });

                // Highlight nodes
                setNodes((nds) => nds.map((n) => {
                    if (violatingIds.has(n.id)) {
                        return { ...n, style: { ...n.style, border: '2px solid red', boxShadow: '0 0 10px red', borderRadius: '6px' } };
                    }
                    return n;
                }));

                // Highlight edges
                setEdges((eds) => eds.map((e) => {
                    if (violatingIds.has(e.id)) {
                        return {
                            ...e,
                            style: { ...e.style, stroke: 'red', strokeWidth: 2 },
                            markerEnd: { type: MarkerType.ArrowClosed, color: 'red' },
                            zIndex: 10
                        };
                    }
                    return e;
                }));

            } else {
                alert('Analysis failed: ' + result.error);
            }
        } catch (error) {
            console.error("Analysis error:", error);
            alert("An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleThreatClick = (violation, typeKey, index) => {
        if (!idMapping || !analysisResult) return;

        const uniqueId = `${typeKey}-${index}`;

        // Toggle Logic
        if (selectedThreatId === uniqueId) {
            // Deselect
            setFocusedPath(new Set());
            setSelectedThreatId(null);

            // Restore Red State (Code below handles this by checking focusedPath size)
        } else {
            // Select new
            setSelectedThreatId(uniqueId);

            const newFocusedPath = new Set();

            Object.values(violation).forEach(val => {
                if (!val) return;
                const match = val.match(/(System|Connection)[^0-9]*(\d+)/);
                if (match) {
                    const type = match[1] === 'System' ? 'systems' : 'connections';
                    const id = parseInt(match[2]);
                    const item = idMapping[type].find(i => i.id == id);

                    if (item) {
                        newFocusedPath.add(item.realId);

                        // If it's a connection, also highlight the source and target nodes to show the "Path"
                        if (type === 'connections') {
                            const fromSys = idMapping.systems.find(s => s.id === item.from);
                            const toSys = idMapping.systems.find(s => s.id === item.to);
                            if (fromSys) newFocusedPath.add(fromSys.realId);
                            if (toSys) newFocusedPath.add(toSys.realId);
                        }
                    }
                }
            });
            setFocusedPath(newFocusedPath);
        }
    };

    // Effect to update styles based on focusedPath
    useEffect(() => {
        if (!analysisResult) return;

        // Re-calculate violating IDs to restore Red state for non-focused violations
        const violatingIds = new Set();
        const threats = analysisResult.threats;
        Object.values(threats).flat().forEach(v => {
            Object.values(v).forEach(val => {
                if (!val) return;
                const match = val.match(/(System|Connection)[^0-9]*(\d+)/);
                if (match) {
                    const type = match[1] === 'System' ? 'systems' : 'connections';
                    const id = parseInt(match[2]);
                    const item = idMapping && idMapping[type] ? idMapping[type].find(i => i.id == id) : null;
                    if (item) {
                        violatingIds.add(item.realId);
                    }
                }
            });
        });

        setNodes((nds) => nds.map((n) => {
            const isFocused = focusedPath.has(n.id);
            const isViolation = violatingIds.has(n.id);

            let newStyle = { ...n.style };

            if (isFocused) {
                newStyle.border = '3px solid #3b82f6'; // Blue-500
                newStyle.boxShadow = '0 0 15px #3b82f6';
            } else if (isViolation) {
                newStyle.border = '2px solid red';
                newStyle.boxShadow = '0 0 10px red';
            } else {
                newStyle.border = undefined;
                newStyle.boxShadow = undefined;
                newStyle.borderRadius = undefined;
            }
            // Apply rounded corners for highlighting
            if (isFocused || isViolation) {
                newStyle.borderRadius = '6px';
            }
            return { ...n, style: newStyle };
        }));

        setEdges((eds) => eds.map((e) => {
            const isFocused = focusedPath.has(e.id);
            const isViolation = violatingIds.has(e.id);

            let newStyle = { ...e.style };
            let newMarkerEnd = { type: MarkerType.ArrowClosed };
            let newZIndex = 0;

            if (isFocused) {
                newStyle.stroke = '#3b82f6';
                newStyle.strokeWidth = 4;
                newMarkerEnd.color = '#3b82f6';
                newZIndex = 999;
            } else if (isViolation) {
                newStyle.stroke = 'red';
                newStyle.strokeWidth = 2;
                newMarkerEnd.color = 'red';
                newZIndex = 10;
            } else {
                newStyle.stroke = undefined;
                newStyle.strokeWidth = undefined;
                newMarkerEnd.color = '#b1b1b7';
                newZIndex = 0;
            }
            return { ...e, style: newStyle, markerEnd: newMarkerEnd, zIndex: newZIndex };
        }));

    }, [focusedPath, analysisResult, idMapping, setNodes, setEdges]);


    const handleClosePanel = () => {
        setAnalysisResult(null);
        setFocusedPath(new Set());
        setSelectedThreatId(null);
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear the entire diagram?')) {
            setNodes([]);
            setEdges([]);
            setAnalysisResult(null);
            setFocusedPath(new Set());
            setSelectedElement(null);
            id = 0; // Reset ID counter if desired, though not strictly necessary
        }
    };

    return (
        <div className="h-screen w-screen relative bg-slate-50 overflow-hidden">
            {/* Canvas Layer */}
            <div className="absolute inset-0 z-0" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg m-4 text-gray-600" />
                    <Background variant="dots" gap={20} size={1} color="#cbd5e1" />
                </ReactFlow>
            </div>

            {/* Floating UI Layer */}

            {/* Top Center Actions */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 glass-panel p-1.5 rounded-xl transition-all hover:shadow-md">
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Clear Canvas
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

            <Sidebar />

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

export default function Editor() {
    return (
        <ReactFlowProvider>
            <EditorContent />
        </ReactFlowProvider>
    );
}
