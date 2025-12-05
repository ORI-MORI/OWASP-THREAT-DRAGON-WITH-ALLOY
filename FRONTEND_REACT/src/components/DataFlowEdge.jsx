import React from 'react';
import { BaseEdge, useNodes, getBezierPath } from 'reactflow';
import { FileText, Cpu, Image as ImageIcon, Database } from 'lucide-react';

// Helper to get icon component based on file type
const getIcon = (type) => {
    const staticClass = "static-icon";
    switch (type) {
        case 'Document': return <FileText size={14} color="#2563eb" fill="white" className={staticClass} />;
        case 'Executable': return <Cpu size={14} color="#dc2626" fill="white" className={staticClass} />;
        case 'Media': return <ImageIcon size={14} color="#16a34a" fill="white" className={staticClass} />;
        default: return <Database size={14} color="#9333ea" fill="white" className={staticClass} />;
    }
};

export default function DataFlowEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    source,
    target,
    data,
    animated,
    selected,
}) {
    // Use useNodes for reactive updates
    const nodes = useNodes();
    const sourceNode = nodes.find(n => n.id === source);

    const isBidirectional = data?.isBidirectional !== false;

    // Shorten the path for unidirectional edges so it doesn't overlap the manual arrow
    let pathTargetX = targetX;
    let pathTargetY = targetY;

    if (!isBidirectional) {
        const offset = 10; // Length of the arrow
        switch (targetPosition) {
            case 'top': pathTargetY -= offset; break;
            case 'bottom': pathTargetY += offset; break;
            case 'left': pathTargetX -= offset; break;
            case 'right': pathTargetX += offset; break;
            default: break;
        }
    }

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX: pathTargetX,
        targetY: pathTargetY,
        targetPosition,
    });

    // Parse carries data
    const carriesStr = data?.carries || '';
    let carriedIds = [];
    if (Array.isArray(carriesStr)) {
        carriedIds = carriesStr;
    } else if (typeof carriesStr === 'string' && carriesStr.trim() !== '') {
        carriedIds = carriesStr.split(',').map(x => {
            const trimmed = x.trim();
            const num = parseInt(trimmed);
            return isNaN(num) ? trimmed : num; // Return number if it is one, else string
        });
    }

    // Find carried data details from source node
    const carriedData = [];
    if (sourceNode && sourceNode.data && sourceNode.data.storedData) {
        carriedIds.forEach(id => {
            const dataItem = sourceNode.data.storedData.find(d => d.id === id);
            if (dataItem) {
                carriedData.push(dataItem);
            }
        });
    }

    // Debugging
    // console.log('Edge', id, 'Carried:', carriedData);

    // isBidirectional is already defined above

    // Ensure style includes animation if animated prop is true
    // Ensure style includes animation if animated prop is true
    // Ensure style includes animation if animated prop is true
    const edgeStyle = {
        ...style,
        strokeWidth: selected ? 3 : 2,
        stroke: selected ? '#6366f1' : '#94a3b8', // Indigo-500 : Slate-400
        strokeDasharray: (animated && !isBidirectional) ? 5 : 'none',
        animation: (animated && !isBidirectional) ? 'dashdraw 0.5s linear infinite' : 'none',
        filter: selected ? 'drop-shadow(0 0 3px rgba(99, 102, 241, 0.5))' : undefined,
    };

    // Calculate arrow rotation based on target position
    let arrowRotation = 0;
    switch (targetPosition) {
        case 'top': arrowRotation = 90; break;
        case 'bottom': arrowRotation = 270; break;
        case 'left': arrowRotation = 0; break;
        case 'right': arrowRotation = 180; break;
        default: arrowRotation = 0;
    }

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={undefined} // We render manual arrow for unidirectional
                markerStart={undefined}
                style={edgeStyle}
            />

            {/* Manual Arrow for Unidirectional */}
            {!isBidirectional && (
                <g transform={`translate(${targetX}, ${targetY}) rotate(${arrowRotation})`}>
                    <path
                        d="M -10 -5 L 0 0 L -10 5 Z" // Simple arrow head pointing right (0 deg)
                        fill={selected ? '#6366f1' : '#94a3b8'}
                    />
                </g>
            )}

            {animated && (
                <style>
                    {`
                        @keyframes dashdraw {
                            from { stroke-dashoffset: 10; }
                        }
                    `}
                </style>
            )}

            {carriedData.length > 0 && (
                <foreignObject
                    width={carriedData.length * 28 + 16}
                    height={34}
                    x={labelX - (carriedData.length * 28 + 16) / 2}
                    y={labelY - 17}
                    className="overflow-visible pointer-events-none"
                >
                    <div className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-white rounded-full border border-gray-200 w-full h-full">
                        {carriedData.map((item) => (
                            <div key={item.id} className="flex items-center justify-center w-6 h-6 bg-gray-50 rounded-full border border-gray-100 animate-none" title={item.label}>
                                {getIcon(item.fileType)}
                            </div>
                        ))}
                    </div>
                </foreignObject>
            )}
        </>
    );
}
