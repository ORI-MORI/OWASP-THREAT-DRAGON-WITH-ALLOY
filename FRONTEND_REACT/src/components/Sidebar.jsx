import React from 'react';

export default function Sidebar() {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="absolute left-4 top-48 z-10 w-52 glass-panel rounded-xl p-4 flex flex-col gap-4 transition-all hover:shadow-lg">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200/50 pb-2">
                Component Palette
            </h2>

            <div className="space-y-3">
                <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Zones</div>
                    <div
                        className="bg-white/80 hover:bg-white p-3 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        onDragStart={(event) => onDragStart(event, 'zone', 'New Zone')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-400"></div>
                        <span className="text-sm text-gray-700">Zone Group</span>
                    </div>
                </div>

                <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Systems</div>
                    <div className="grid grid-cols-1 gap-2">
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'Server')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                            <span className="text-sm text-gray-700">Server</span>
                        </div>
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'PC')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">PC / Terminal</span>
                        </div>
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'Gateway')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-orange-500 rotate-45"></div>
                            <span className="text-sm text-gray-700">Gateway</span>
                        </div>
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'Mobile')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-pink-500 rounded-md"></div>
                            <span className="text-sm text-gray-700">Mobile</span>
                        </div>
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'Security Device')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-red-500 rounded-bl-lg rounded-br-lg"></div>
                            <span className="text-sm text-gray-700">Security Device</span>
                        </div>
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'Wireless AP')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">Wireless AP</span>
                        </div>
                        <div
                            className="bg-white/80 hover:bg-white p-2 rounded-lg border border-gray-200/50 cursor-grab shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            onDragStart={(event) => onDragStart(event, 'system', 'SaaS')}
                            draggable
                        >
                            <div className="w-3 h-3 bg-sky-500 rounded-full opacity-70"></div>
                            <span className="text-sm text-gray-700">SaaS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
