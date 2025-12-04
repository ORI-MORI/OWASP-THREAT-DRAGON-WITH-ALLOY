import React, { memo } from 'react';
import { Handle, Position, useStore } from 'reactflow';
import { Server, Monitor, Shield, Smartphone, Globe, Router, Wifi, Cloud } from 'lucide-react';

const icons = {
    Server: Server,
    Terminal: Monitor,
    NetworkDevice: Router,
    SecurityDevice: Shield,
    Mobile: Smartphone,
    WirelessAP: Wifi,
    SaaS: Cloud,
};

const connectionNodeIdSelector = (state) => state.connectionNodeId;

const SystemNode = ({ data, selected }) => {
    const Icon = icons[data.type] || Server;
    const connectionNodeId = useStore(connectionNodeIdSelector);
    const isConnecting = !!connectionNodeId;

    // Dynamic z-index: Source on top normally, Target on top when connecting
    const sourceStyle = { zIndex: isConnecting ? 0 : 1, width: 12, height: 12, background: '#9ca3af' }; // Visible gray
    const targetStyle = { zIndex: isConnecting ? 1 : 0, width: 12, height: 12, background: 'transparent' }; // Invisible

    return (
        <div className={`shadow-md rounded-md bg-white border-2 p-2 min-w-[100px] flex flex-col items-center justify-center transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
            {/* TOP */}
            <Handle type="source" position={Position.Top} id="top-source" className="rounded-full" style={sourceStyle} />
            <Handle type="target" position={Position.Top} id="top-target" className="rounded-full" style={targetStyle} />

            {/* LEFT */}
            <Handle type="source" position={Position.Left} id="left-source" className="rounded-full" style={sourceStyle} />
            <Handle type="target" position={Position.Left} id="left-target" className="rounded-full" style={targetStyle} />

            <Icon className="w-8 h-8 text-gray-600 mb-2" />
            <div className="text-xs font-bold text-center">{data.label}</div>
            <div className="text-[10px] text-gray-400">{data.type}</div>

            {data.grade && (
                <div className={`mt-1 text-[10px] px-1 rounded ${data.grade === 'Classified' ? 'bg-red-100 text-red-800' :
                    data.grade === 'Sensitive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {data.grade}
                </div>
            )}

            {/* RIGHT */}
            <Handle type="source" position={Position.Right} id="right-source" className="rounded-full" style={sourceStyle} />
            <Handle type="target" position={Position.Right} id="right-target" className="rounded-full" style={targetStyle} />

            {/* BOTTOM */}
            <Handle type="source" position={Position.Bottom} id="bottom-source" className="rounded-full" style={sourceStyle} />
            <Handle type="target" position={Position.Bottom} id="bottom-target" className="rounded-full" style={targetStyle} />
        </div>
    );
};

export default memo(SystemNode);
