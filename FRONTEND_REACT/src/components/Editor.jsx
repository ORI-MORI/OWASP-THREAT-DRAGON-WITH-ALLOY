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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play } from 'lucide-react';

import Sidebar from './Sidebar';
import ZoneNode from './ZoneNode';
import SystemNode from './SystemNode';
import PropertyPanel from './PropertyPanel';
import AnalysisPanel from './AnalysisPanel';
import useStore from '../store';
import { convertGraphToJSON } from '../utils/graphConverter';
import { analyzeGraph } from '../api/analyze';

const nodeTypes = {
    zone: ZoneNode,
    system: SystemNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const EditorContent = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { project } = useReactFlow();
    const { setSelectedElement } = useStore();
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

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

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

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label, grade: 'Open', type: label },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    const handleAnalyze = async () => {
        // Reset styles
        setNodes((nds) => nds.map((n) => ({ ...n, style: {} })));
        setEdges((eds) => eds.map((e) => ({ ...e, style: {} })));
        setAnalysisResult(null);

        const payload = convertGraphToJSON(nodes, edges);
        console.log('Payload:', payload);

        const result = await analyzeGraph(payload);
        console.log('Result:', result);

        if (result.success) {
            setAnalysisResult(result.result);

            // Highlighting Logic
            const violatingIds = new Set();
            const threats = result.result.threats;

            Object.values(threats).flat().forEach(violation => {
                // Extract IDs from violation object values (system, connection, data)
                Object.values(violation).forEach(val => {
                    // val is like "System99" or "Connection1"
                    const match = val.match(/(System|Connection)(\d+)/);
                    if (match) {
                        const type = match[1] === 'System' ? 'systems' : 'connections';
                        const id = parseInt(match[2]);

                        // Find real ID from mapping
                        const item = payload._mapping[type].find(i => i.id === id);
                        if (item) {
                            violatingIds.add(item.realId);
                        }
                    }
                });
            });

            // Highlight nodes
            setNodes((nds) => nds.map((n) => {
                if (violatingIds.has(n.id)) {
                    return { ...n, style: { ...n.style, border: '2px solid red', boxShadow: '0 0 10px red' } };
                }
                return n;
            }));

            // Highlight edges
            setEdges((eds) => eds.map((e) => {
                if (violatingIds.has(e.id)) {
                    return { ...e, style: { ...e.style, stroke: 'red', strokeWidth: 2 } };
                }
                return e;
            }));

        } else {
            alert('Analysis failed: ' + result.error);
        }
    };

    const handleClosePanel = () => {
        setAnalysisResult(null);
    };

    return (
        <div className="flex flex-row h-screen w-screen">
            <Sidebar />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={handleAnalyze}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Play size={16} /> Analyze
                    </button>
                </div>

                {/* Analysis Results Panel */}
                <AnalysisPanel
                    result={analysisResult}
                    onClose={handleClosePanel}
                />

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>
            <PropertyPanel />
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
