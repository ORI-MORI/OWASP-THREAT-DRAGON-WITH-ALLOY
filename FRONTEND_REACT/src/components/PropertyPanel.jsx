import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import useStore from '../store';

export default function PropertyPanel({ analysisResult, onThreatClick, selectedThreatId }) {
    const { selectedElement, setSelectedElement } = useStore();
    const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'threats'

    useEffect(() => {
        if (selectedElement) {
            setFormData(selectedElement.data || {});
            setActiveTab('properties');
        } else {
            setFormData({});
        }
    }, [selectedElement]);

    // Automatically switch to threats tab if there are violations
    useEffect(() => {
        if (analysisResult && analysisResult.total_count > 0) {
            setActiveTab('threats');
        }
    }, [analysisResult]);

    const handleChange = (key, value) => {
        const newData = { ...formData, [key]: value };
        setFormData(newData);

        if (selectedElement.source) {
            // It's an edge
            setEdges((edges) =>
                edges.map((edge) =>
                    edge.id === selectedElement.id ? { ...edge, data: newData } : edge
                )
            );
        } else {
            // It's a node
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === selectedElement.id ? { ...node, data: newData } : node
                )
            );
        }
        setSelectedElement({ ...selectedElement, data: newData });
    };

    // Helper to update stored data list
    const addData = () => {
        const currentData = formData.storedData || [];
        const newId = currentData.length > 0 ? Math.max(...currentData.map(d => d.id)) + 1 : 1;
        const newDataItem = { id: newId, grade: 'Sensitive', fileType: 'Document' };

        // 1. Update the Node's storedData
        handleChange('storedData', [...currentData, newDataItem]);

        // 2. Auto-propagate to outgoing edges
        // Find all edges where source is this node
        setEdges((edges) => edges.map((edge) => {
            if (edge.source === selectedElement.id) {
                // Parse current carries
                const currentCarries = (edge.data?.carries || '')
                    .toString()
                    .split(',')
                    .map(x => parseInt(x.trim()))
                    .filter(x => !isNaN(x));

                // Add new ID if not present (it shouldn't be)
                const newCarries = [...currentCarries, newId];

                return {
                    ...edge,
                    data: {
                        ...edge.data,
                        carries: newCarries.join(', ')
                    }
                };
            }
            return edge;
        }));
    };

    const removeData = (id) => {
        const currentData = formData.storedData || [];
        handleChange('storedData', currentData.filter(d => d.id !== id));
    };

    const updateData = (id, field, value) => {
        const currentData = formData.storedData || [];
        handleChange('storedData', currentData.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleDelete = () => {
        if (!selectedElement) return;

        if (window.confirm('Are you sure you want to delete this element?')) {
            if (selectedElement.source) {
                // It's an edge
                setEdges((edges) => edges.filter((edge) => edge.id !== selectedElement.id));
            } else {
                // It's a node
                setNodes((nodes) => nodes.filter((node) => node.id !== selectedElement.id));
            }
            setSelectedElement(null);
        }
    };

    const renderPropertiesTab = () => {
        if (!selectedElement) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">No Selection</p>
                    <p className="text-xs text-gray-400 mt-1">Select a node or edge to view properties.</p>
                </div>
            );
        }

        const isNode = !selectedElement.source;
        const isZone = isNode && selectedElement.type === 'zone';
        const isSystem = isNode && selectedElement.type === 'system';
        const isEdge = !!selectedElement.source;

        const inputClass = "mt-1 block w-full rounded-lg border-gray-200/50 bg-white/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 transition-all hover:bg-white/80";
        const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";

        return (
            <div className="flex flex-col gap-5">
                <div className="text-[10px] font-mono text-gray-400 bg-gray-50/50 p-1 rounded inline-block self-start">ID: {selectedElement.id}</div>

                {/* Common Label/Name */}
                {isNode && (
                    <div>
                        <label className={labelClass}>Name</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            placeholder="Enter name..."
                        />
                    </div>
                )}

                {/* Zone Specific */}
                {isZone && (
                    <>
                        <div>
                            <label className={labelClass}>Grade</label>
                            <select
                                className={inputClass}
                                value={formData.grade || 'Open'}
                                onChange={(e) => handleChange('grade', e.target.value)}
                            >
                                <option value="Classified">Classified</option>
                                <option value="Sensitive">Sensitive</option>
                                <option value="Open">Open</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Type</label>
                            <select
                                className={inputClass}
                                value={formData.type || 'Internet'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                <option value="Internet">Internet</option>
                                <option value="Intranet">Intranet</option>
                                <option value="DMZ">DMZ</option>
                                <option value="Wireless">Wireless</option>
                                <option value="PPP">PPP</option>
                                <option value="Cloud">Cloud</option>
                            </select>
                        </div>
                    </>
                )}

                {/* System Specific */}
                {isSystem && (
                    <>
                        <div>
                            <label className={labelClass}>Location (Zone)</label>
                            <select
                                className={inputClass}
                                value={formData.loc || ''}
                                onChange={(e) => handleChange('loc', e.target.value)}
                            >
                                <option value="">(None)</option>
                                {getNodes().filter(n => n.type === 'zone').map(zone => (
                                    <option key={zone.id} value={zone.id}>
                                        {zone.data.label || `Zone ${zone.id}`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1 italic">Override automatic placement.</p>
                        </div>

                        <div>
                            <label className={labelClass}>Grade (Inherited if empty)</label>
                            <select
                                className={inputClass}
                                value={formData.grade || 'Open'}
                                onChange={(e) => handleChange('grade', e.target.value)}
                            >
                                <option value="Classified">Classified</option>
                                <option value="Sensitive">Sensitive</option>
                                <option value="Open">Open</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Type</label>
                            <select
                                className={inputClass}
                                value={formData.type || 'Server'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                <option value="Terminal">Terminal</option>
                                <option value="Server">Server</option>
                                <option value="SecurityDevice">Security Device</option>
                                <option value="NetworkDevice">Network Device</option>
                                <option value="Mobile">Mobile</option>
                                <option value="WirelessAP">Wireless AP</option>
                                <option value="SaaS">SaaS</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Auth Type</label>
                            <select
                                className={inputClass}
                                value={formData.authType || 'Single'}
                                onChange={(e) => handleChange('authType', e.target.value)}
                            >
                                <option value="Single">Single Factor</option>
                                <option value="MFA">MFA</option>
                            </select>
                        </div>

                        {formData.type === 'Terminal' && (
                            <div>
                                <label className={labelClass}>Isolation (VDI/RBI)</label>
                                <select
                                    className={inputClass}
                                    value={formData.isolation || 'None'}
                                    onChange={(e) => handleChange('isolation', e.target.value)}
                                >
                                    <option value="None">None</option>
                                    <option value="VDI">VDI</option>
                                    <option value="RBI">RBI</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isCDS"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isCDS || false}
                                    onChange={(e) => handleChange('isCDS', e.target.checked)}
                                />
                                <label htmlFor="isCDS" className="text-sm font-medium text-gray-700 cursor-pointer">Is CDS (Cross Domain)?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isRegistered"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isRegistered || false}
                                    onChange={(e) => handleChange('isRegistered', e.target.checked)}
                                />
                                <label htmlFor="isRegistered" className="text-sm font-medium text-gray-700 cursor-pointer">Is Registered Device?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isStorageEncrypted"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isStorageEncrypted || false}
                                    onChange={(e) => handleChange('isStorageEncrypted', e.target.checked)}
                                />
                                <label htmlFor="isStorageEncrypted" className="text-sm font-medium text-gray-700 cursor-pointer">Is Storage Encrypted?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isManagement"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isManagement || false}
                                    onChange={(e) => handleChange('isManagement', e.target.checked)}
                                />
                                <label htmlFor="isManagement" className="text-sm font-medium text-gray-700 cursor-pointer">Is Management Device?</label>
                            </div>

                            {formData.type === 'Mobile' && (
                                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        id="hasMDM"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={formData.hasMDM || false}
                                        onChange={(e) => handleChange('hasMDM', e.target.checked)}
                                    />
                                    <label htmlFor="hasMDM" className="text-sm font-medium text-gray-700 cursor-pointer">Has MDM?</label>
                                </div>
                            )}
                        </div>

                        {/* Data Assets Management */}
                        <div className="border-t border-gray-200/50 pt-4 mt-2">
                            <div className="flex justify-between items-center mb-3">
                                <label className={labelClass}>Stored Data Assets</label>
                                <button
                                    onClick={addData}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded-md hover:bg-indigo-100 font-medium transition-colors"
                                >
                                    + Add Data
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(formData.storedData || []).map((data) => (
                                    <div key={data.id} className="bg-white/60 p-3 rounded-lg border border-gray-200/50 text-xs shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-indigo-900">Data #{data.id}</span>
                                            <button
                                                onClick={() => removeData(data.id)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">Grade</label>
                                                <select
                                                    className="w-full border-gray-200/50 bg-white rounded text-xs p-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={data.grade}
                                                    onChange={(e) => updateData(data.id, 'grade', e.target.value)}
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="Sensitive">Sensitive</option>
                                                    <option value="Classified">Classified</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">Type</label>
                                                <select
                                                    className="w-full border-gray-200/50 bg-white rounded text-xs p-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={data.fileType}
                                                    onChange={(e) => updateData(data.id, 'fileType', e.target.value)}
                                                >
                                                    <option value="Document">Document</option>
                                                    <option value="Executable">Executable</option>
                                                    <option value="Media">Media</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(formData.storedData || []).length === 0 && (
                                    <div className="text-xs text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">
                                        No data stored.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Edge Specific */}
                {isEdge && (
                    <>
                        <div>
                            <label className={labelClass}>Protocol</label>
                            <select
                                className={inputClass}
                                value={formData.protocol || 'HTTPS'}
                                onChange={(e) => handleChange('protocol', e.target.value)}
                            >
                                <option value="HTTPS">HTTPS</option>
                                <option value="SSH">SSH</option>
                                <option value="VPN_Tunnel">VPN Tunnel</option>
                                <option value="ClearText">ClearText (HTTP/Telnet)</option>
                                <option value="SQL">SQL</option>
                            </select>
                        </div>

                        {(() => {
                            const sourceNode = getNodes().find(n => n.id === selectedElement.source);
                            const targetNode = getNodes().find(n => n.id === selectedElement.target);
                            const sourceLabel = sourceNode?.data?.label || sourceNode?.id || 'Source';
                            const targetLabel = targetNode?.data?.label || targetNode?.id || 'Target';

                            return (
                                <div className="flex flex-col gap-3 border-t border-gray-200/50 pt-4 mt-2">
                                    <h4 className={labelClass}>Connection Settings</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Flow Type</label>
                                        <select
                                            className={inputClass}
                                            value={formData.isBidirectional !== false ? 'bidirectional' : 'unidirectional'}
                                            onChange={(e) => handleChange('isBidirectional', e.target.value === 'bidirectional')}
                                        >
                                            <option value="bidirectional">Bidirectional (Both Ways)</option>
                                            <option value="unidirectional">Unidirectional (One Way)</option>
                                        </select>
                                    </div>

                                    {formData.isBidirectional === false && (
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                                            <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-gray-200/50">
                                                <span className="text-xs text-gray-600 font-medium truncate max-w-[150px]" title={`${sourceLabel} → ${targetLabel}`}>
                                                    {sourceLabel} → {targetLabel}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const oldEdge = getEdges().find(e => e.id === selectedElement.id);
                                                        if (oldEdge) {
                                                            const mapToSourceHandle = (handleId) => {
                                                                if (!handleId) return 'right-source';
                                                                if (handleId.includes('-target')) return handleId.replace('-target', '-source');
                                                                if (handleId.includes('-source')) return handleId;
                                                                return `${handleId}-source`;
                                                            };

                                                            const mapToTargetHandle = (handleId) => {
                                                                if (!handleId) return 'left-target';
                                                                if (handleId.includes('-source')) return handleId.replace('-source', '-target');
                                                                if (handleId.includes('-target')) return handleId;
                                                                return `${handleId}-target`;
                                                            };

                                                            const newEdge = {
                                                                ...oldEdge,
                                                                id: `e-${Date.now()}`,
                                                                source: oldEdge.target,
                                                                target: oldEdge.source,
                                                                sourceHandle: mapToSourceHandle(oldEdge.targetHandle),
                                                                targetHandle: mapToTargetHandle(oldEdge.sourceHandle),
                                                                data: { ...oldEdge.data, isBidirectional: false }
                                                            };

                                                            setEdges((eds) => eds.filter(e => e.id !== oldEdge.id).concat(newEdge));
                                                            setSelectedElement(newEdge);
                                                        }
                                                    }}
                                                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm flex items-center gap-1 transition-colors"
                                                    title="Reverse Direction"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                                                    Swap
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                Click Swap to reverse the flow direction.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isEncrypted"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isEncrypted || false}
                                    onChange={(e) => handleChange('isEncrypted', e.target.checked)}
                                />
                                <label htmlFor="isEncrypted" className="text-sm font-medium text-gray-700 cursor-pointer">Is Encrypted?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasCDR"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasCDR || false}
                                    onChange={(e) => handleChange('hasCDR', e.target.checked)}
                                />
                                <label htmlFor="hasCDR" className="text-sm font-medium text-gray-700 cursor-pointer">Has CDR?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasDLP"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasDLP || false}
                                    onChange={(e) => handleChange('hasDLP', e.target.checked)}
                                />
                                <label htmlFor="hasDLP" className="text-sm font-medium text-gray-700 cursor-pointer">Has DLP?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasAntiVirus"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasAntiVirus || false}
                                    onChange={(e) => handleChange('hasAntiVirus', e.target.checked)}
                                />
                                <label htmlFor="hasAntiVirus" className="text-sm font-medium text-gray-700 cursor-pointer">Has Anti-Virus?</label>
                            </div>
                        </div>

                        <div className="pt-4 mt-2 border-t border-gray-200/50">
                            <label className={labelClass}>Carries Data</label>

                            {(() => {
                                const sourceNode = getNodes().find(n => n.id === selectedElement.source);
                                const availableData = sourceNode?.data?.storedData || [];

                                const currentCarries = (formData.carries || '')
                                    .toString()
                                    .split(',')
                                    .map(x => x.trim())
                                    .filter(x => x !== '');

                                const handleAddData = () => {
                                    if (availableData.length === 0) return;
                                    const firstAvailable = availableData[0].id;
                                    const newCarries = [...currentCarries, firstAvailable];
                                    handleChange('carries', newCarries.join(', '));
                                };

                                const handleRemoveData = (indexToRemove) => {
                                    const newCarries = currentCarries.filter((_, idx) => idx !== indexToRemove);
                                    handleChange('carries', newCarries.join(', '));
                                };

                                const handleUpdateData = (indexToUpdate, newValue) => {
                                    const newCarries = [...currentCarries];
                                    newCarries[indexToUpdate] = newValue;
                                    handleChange('carries', newCarries.join(', '));
                                };

                                if (availableData.length === 0) {
                                    return (
                                        <div className="text-xs text-gray-500 italic bg-gray-50/50 p-3 rounded-lg border border-dashed border-gray-300 text-center">
                                            No data available in source node.
                                            <br />Add "Stored Data" to the source node first.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-2">
                                        {currentCarries.map((dataId, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select
                                                    className="block w-full rounded-md border-gray-200/50 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-1.5"
                                                    value={dataId}
                                                    onChange={(e) => handleUpdateData(idx, e.target.value)}
                                                >
                                                    {availableData.map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            Data #{d.id} ({d.fileType})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleRemoveData(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                                                    title="Remove"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={handleAddData}
                                            className="w-full py-2 text-xs border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 font-medium"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            Add Data Flow
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </>
                )}

                {/* Delete Button */}
                <div className="border-t border-gray-200/50 pt-4 mt-4 pb-4">
                    <button
                        onClick={handleDelete}
                        className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete {isEdge ? 'Connection' : 'Element'}
                    </button>
                </div>
            </div>
        );
    };

    const renderThreatsTab = () => {
        if (!analysisResult) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Shield size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No analysis performed yet.</p>
                    <p className="text-xs mt-1">Click "Analyze" to check for threats.</p>
                </div>
            );
        }

        const threats = analysisResult.threats || {};
        const total_count = analysisResult.total_count !== undefined
            ? analysisResult.total_count
            : Object.values(threats).reduce((acc, items) => acc + items.length, 0);

        const hasViolations = total_count > 0;

        if (!hasViolations) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <p className="text-lg font-bold text-green-700">Secure</p>
                    <p className="text-sm text-gray-500 mt-1">No security violations found.</p>
                </div>
            );
        }

        // --- Helper to merge bidirectional threats ---
        const getMergedThreats = (violationType, items) => {
            const merged = [];
            const processedIndices = new Set();

            items.forEach((item, index) => {
                if (processedIndices.has(index)) return;

                // Find potential duplicate (same system, same data, similar connection)
                // Note: Connections might have different IDs like "flow_a_b" and "flow_b_a"
                // But usually for bidirectional they share other properties.
                // A better heuristic is: if everything except the connection ID is the same,
                // AND the connection IDs look like reverse of each other or we know they are pair.
                // For simplicity, let's group by "System + Data" for now, as that's usually the unique pair for a threat type.
                // Or "Source + Target + Data".

                // Let's look ahead for a match
                let matchIndex = -1;
                for (let i = index + 1; i < items.length; i++) {
                    if (processedIndices.has(i)) continue;
                    const other = items[i];

                    // Heuristic: If they involve the same System and the same Data, they are likely the same threat just reverse direction
                    // Adjust this logic if needed based on specific threat types
                    const sameSystem = item.system === other.system;
                    // Some threats might not have 'system' but 'connection'
                    const sameData = item.data === other.data; // assuming 'data' field exists in threat detail

                    // Specific check for connection reversal if available
                    // const connectionReversed = item.connection && other.connection && ...

                    if (sameSystem && sameData) {
                        // Found a duplicate candidate
                        matchIndex = i;
                        break;
                    }
                }

                if (matchIndex !== -1) {
                    // Merge
                    merged.push({
                        ...item,
                        _mergedIndices: [index, matchIndex], // Keep track of original indices
                        label: `${item.system} (Bidirectional)`
                    });
                    processedIndices.add(index);
                    processedIndices.add(matchIndex);
                } else {
                    // No duplicate found
                    merged.push({
                        ...item,
                        _mergedIndices: [index],
                    });
                    processedIndices.add(index);
                }
            });
            return merged;
        };


        return (
            <div className="space-y-4 p-1">
                <div className="flex items-center gap-2 mb-2 bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="font-bold text-red-700">{total_count} Violations Found</span>
                </div>
                {Object.entries(threats).map(([key, items]) => {
                    if (items.length === 0) return null;

                    // --- Merging Logic ---
                    const mergedItems = [];
                    const processedIndices = new Set();

                    items.forEach((item, index) => {
                        if (processedIndices.has(index)) return;

                        const group = {
                            primary: item,
                            indices: [index],
                            allData: item.data ? [item.data] : []
                        };

                        // Look for duplicates in the rest of the list
                        for (let i = index + 1; i < items.length; i++) {
                            if (processedIndices.has(i)) continue;
                            const other = items[i];

                            // Check for identity: Same System/Connection AND Same Remediation
                            const sameSystem = item.system === other.system;
                            const sameConnection = item.connection === other.connection;
                            const sameRemediation = item.remediation === other.remediation;

                            // Match if Remediation matches AND (System or Connection matches)
                            const isMatch = sameRemediation && (
                                (item.system && sameSystem) ||
                                (item.connection && sameConnection)
                            );

                            if (isMatch) {
                                group.indices.push(i);
                                if (other.data && !group.allData.includes(other.data)) {
                                    group.allData.push(other.data);
                                }
                                processedIndices.add(i);
                            }
                        }

                        mergedItems.push(group);
                        processedIndices.add(index);
                    });


                    return (
                        <div key={key} className="border border-red-100 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="bg-red-50/50 px-3 py-2 border-b border-red-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <h4 className="font-semibold text-red-900 text-xs uppercase tracking-wide">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {mergedItems.map((group, idx) => {
                                    const item = group.primary;
                                    // Use a composite ID for selection dealing with merged items
                                    const compositeId = `${key}-${group.indices.join(',')}`;
                                    const isSelected = selectedThreatId === compositeId;

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 transition-all duration-200 ease-in-out cursor-pointer active:scale-95 hover:bg-red-50/30 ${isSelected
                                                ? 'bg-red-50 border-l-4 border-red-500'
                                                : 'border-l-4 border-transparent'
                                                }`}
                                            onClick={() => onThreatClick && onThreatClick(compositeId)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-gray-700 text-xs">
                                                    Violation #{idx + 1}
                                                    {group.indices.length > 1 && " (Merged)"}
                                                </span>
                                                {isSelected && (
                                                    <span className="text-red-600 font-bold text-[10px] bg-red-100 px-1.5 py-0.5 rounded-full">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>

                                            {/* System or Connection Context */}
                                            <div className="text-xs text-slate-500 mb-2 font-mono">
                                                {item.system ? `System: ${item.system}` : `Connection: ${item.connection}`}
                                            </div>

                                            {/* Data List (Aggregated) */}
                                            {group.allData && group.allData.length > 0 && (
                                                <div className="mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Involved Data</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {group.allData.map((dataId, dIdx) => (
                                                            <span key={dIdx} className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                                Data {dataId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                                <span className="font-semibold text-slate-700 block mb-0.5 not-italic">Remediation:</span>
                                                {item.remediation}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="absolute right-4 top-4 bottom-4 w-80 glass-panel rounded-xl flex flex-col transition-all duration-300 z-20">
            {/* Tabs */}
            <div className="flex border-b border-gray-200/50">
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'properties' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                    onClick={() => setActiveTab('properties')}
                >
                    Properties
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'threats' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                    onClick={() => setActiveTab('threats')}
                >
                    Threats
                    {analysisResult && analysisResult.total_count > 0 && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                            {analysisResult.total_count}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'properties' ? renderPropertiesTab() : renderThreatsTab()}
            </div>
        </div>
    );
}
