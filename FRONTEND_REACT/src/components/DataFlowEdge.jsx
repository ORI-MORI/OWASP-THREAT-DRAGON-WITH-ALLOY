import React from 'react';
import { BaseEdge, useNodes, getBezierPath } from 'reactflow';
import { FileText, Cpu, Image as ImageIcon, Database } from 'lucide-react';

// Helper to get icon component based on file type
const getIcon = (type) => {
    switch (type) {
        case 'Document': return <FileText size={14} color="#2563eb" fill="white" />;
        case 'Executable': return <Cpu size={14} color="#dc2626" fill="white" />;
        case 'Media': return <ImageIcon size={14} color="#16a34a" fill="white" />;
        default: return <Database size={14} color="#9333ea" fill="white" />;
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

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Parse carries data
    const carriesStr = data?.carries || '';
    let carriedIds = [];
    if (Array.isArray(carriesStr)) {
        carriedIds = carriesStr;
    } else if (typeof carriesStr === 'string' && carriesStr.trim() !== '') {
        carriedIds = carriesStr.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
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

    // Default to true if undefined, matching PropertyPanel logic
    const isBidirectional = data?.isBidirectional !== false;

    // Ensure style includes animation if animated prop is true
    // Ensure style includes animation if animated prop is true
    const edgeStyle = {
        ...style,
        strokeWidth: 2, // Keep constant width to prevent arrow scaling
        stroke: selected ? '#2563eb' : (style.stroke || '#000000'), // Blue if selected
        strokeDasharray: (animated && !isBidirectional) ? 5 : 'none',
        animation: (animated && !isBidirectional) ? 'dashdraw 0.5s linear infinite' : 'none',
        filter: selected ? 'drop-shadow(0 0 2px rgba(37, 99, 235, 0.5))' : undefined,
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
                        fill={selected ? '#2563eb' : '#000000'}
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
                <g>
                    {isBidirectional ? (
                        // Static Badge for Bidirectional
                        <foreignObject
                            width={carriedData.length * 24 + 12}
                            height={30}
                            x={labelX - (carriedData.length * 24 + 12) / 2}
                            y={labelY - 15}
                            className="overflow-visible pointer-events-none"
                        >
                            <div className="flex items-center justify-center gap-1 px-1 py-1 bg-white rounded-full shadow-sm border border-gray-200 w-full h-full">
                                {carriedData.map((item) => (
                                    <div key={item.id} className="flex items-center justify-center w-5 h-5">
                                        {getIcon(item.fileType)}
                                    </div>
                                ))}
                            </div>
                        </foreignObject>
                    ) : (
                        // Moving Particles for Unidirectional
                        carriedData.map((item, index) => {
                            // Stagger animations if multiple items
                            const duration = 3; // seconds
                            const delay = index * (duration / carriedData.length);

                            return (
                                <g key={`${id}-data-${item.id}`}>
                                    {/* Invisible circle to guide the animation along the path */}
                                    <circle r="0" fill="none">
                                        <animateMotion
                                            dur={`${duration}s`}
                                            repeatCount="indefinite"
                                            path={edgePath}
                                            begin={`-${delay}s`}
                                            rotate="auto"
                                        >
                                            <mpath href={`#${id}`} />
                                        </animateMotion>
                                    </circle>

                                    {/* The actual moving content */}
                                    <foreignObject
                                        width={24}
                                        height={24}
                                        x={-12}
                                        y={-12}
                                        className="overflow-visible pointer-events-none"
                                    >
                                        <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200">
                                            {getIcon(item.fileType)}
                                        </div>
                                    </foreignObject>

                                    {/* Apply the motion to the foreignObject directly as fallback/ensure */}
                                    <animateMotion
                                        dur={`${duration}s`}
                                        repeatCount="indefinite"
                                        path={edgePath}
                                        begin={`-${delay}s`}
                                        rotate="auto"
                                    />
                                </g>
                            );
                        })
                    )}
                </g>
            )}
        </>
    );
}
