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
    const sourceStyle = { zIndex: isConnecting ? 0 : 1, width: 8, height: 8, background: '#9ca3af' }; // Visible gray
    const targetStyle = { zIndex: isConnecting ? 1 : 0, width: 8, height: 8, background: 'transparent' }; // Invisible

    // Helper for gradient backgrounds based on type
    const getIconBackground = (type) => {
        switch (type) {
            case 'Server': return 'bg-gradient-to-br from-indigo-400 to-indigo-600';
            case 'Terminal': return 'bg-gradient-to-br from-emerald-400 to-emerald-600';
            case 'NetworkDevice': return 'bg-gradient-to-br from-orange-400 to-orange-600';
            case 'SecurityDevice': return 'bg-gradient-to-br from-red-400 to-red-600';
            case 'Mobile': return 'bg-gradient-to-br from-pink-400 to-pink-600';
            case 'WirelessAP': return 'bg-gradient-to-br from-cyan-400 to-cyan-600';
            case 'SaaS': return 'bg-gradient-to-br from-sky-400 to-sky-600';
            default: return 'bg-gradient-to-br from-slate-400 to-slate-600';
        }
    };

    return (
        <div className={`relative group transition-all duration-300 ${selected ? 'scale-105' : 'hover:scale-105'}`}>
            {/* Glow Effect on Selection */}
            {selected && (
                <div className="absolute -inset-1 bg-indigo-500/30 rounded-xl blur-md animate-pulse"></div>
            )}

            {/* Main Card */}
            <div className={`relative min-w-[120px] p-3 rounded-xl glass-panel flex flex-col items-center gap-2 transition-all duration-300 
                ${data.isThreat ? 'border-2 !border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] z-50' :
                    selected ? 'border-indigo-500/50 shadow-indigo-500/20' : 'border-white/40 hover:border-white/60'}`}>

                {/* Icon Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${getIconBackground(data.type)} text-white`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>

                {/* Label & Type */}
                <div className="text-center">
                    <div className="text-xs font-bold text-slate-700 leading-tight">{data.label}</div>
                    <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{data.type}</div>
                </div>

                {/* Grade Badge */}
                {data.grade && (
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shadow-sm ${data.grade === 'Classified' ? 'bg-red-100 text-red-700 border border-red-200' :
                        data.grade === 'Sensitive' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                        {data.grade}
                    </div>
                )}
            </div>

            {/* Connection Handles - Custom Style */}
            {/* TOP */}
            <Handle type="source" position={Position.Top} id="top-source" className="w-2 h-2 !bg-indigo-400 border-2 border-white" style={sourceStyle} />
            <Handle type="target" position={Position.Top} id="top-target" className="w-2 h-2 !bg-indigo-400 border-2 border-white opacity-0 hover:opacity-100" style={targetStyle} />

            {/* LEFT */}
            <Handle type="source" position={Position.Left} id="left-source" className="w-2 h-2 !bg-indigo-400 border-2 border-white" style={sourceStyle} />
            <Handle type="target" position={Position.Left} id="left-target" className="w-2 h-2 !bg-indigo-400 border-2 border-white opacity-0 hover:opacity-100" style={targetStyle} />

            {/* RIGHT */}
            <Handle type="source" position={Position.Right} id="right-source" className="w-2 h-2 !bg-indigo-400 border-2 border-white" style={sourceStyle} />
            <Handle type="target" position={Position.Right} id="right-target" className="w-2 h-2 !bg-indigo-400 border-2 border-white opacity-0 hover:opacity-100" style={targetStyle} />

            {/* BOTTOM */}
            <Handle type="source" position={Position.Bottom} id="bottom-source" className="w-2 h-2 !bg-indigo-400 border-2 border-white" style={sourceStyle} />
            <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2 h-2 !bg-indigo-400 border-2 border-white opacity-0 hover:opacity-100" style={targetStyle} />
        </div>
    );
};

export default memo(SystemNode);
