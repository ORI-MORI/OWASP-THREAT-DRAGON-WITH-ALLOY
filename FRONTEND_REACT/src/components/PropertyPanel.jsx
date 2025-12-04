import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../store';

export default function PropertyPanel({ analysisResult, onThreatClick, selectedThreatId }) {
    const { selectedElement, setSelectedElement } = useStore();
    const { setNodes, setEdges, getNodes } = useReactFlow();
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
                <div className="text-gray-500 text-sm p-4">Select an element to edit properties.</div>
            );
        }

        const isNode = !selectedElement.source;
        const isZone = isNode && selectedElement.type === 'zone';
        const isSystem = isNode && selectedElement.type === 'system';
        const isEdge = !!selectedElement.source;

        return (
            <div className="flex flex-col gap-4">
                <div className="text-xs text-gray-400">ID: {selectedElement.id}</div>

                {/* Common Label/Name */}
                {isNode && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                        />
                    </div>
                )}

                {/* Zone Specific */}
                {isZone && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grade</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                                value={formData.grade || 'Open'}
                                onChange={(e) => handleChange('grade', e.target.value)}
                            >
                                <option value="Classified">Classified</option>
                                <option value="Sensitive">Sensitive</option>
                                <option value="Open">Open</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
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
                            <label className="block text-sm font-medium text-gray-700">Location (Zone)</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
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
                            <p className="text-xs text-gray-500 mt-1">Override automatic placement.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grade (Inherited if empty)</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                                value={formData.grade || 'Open'}
                                onChange={(e) => handleChange('grade', e.target.value)}
                            >
                                <option value="Classified">Classified</option>
                                <option value="Sensitive">Sensitive</option>
                                <option value="Open">Open</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
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
                            <label className="block text-sm font-medium text-gray-700">Auth Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                                value={formData.authType || 'Single'}
                                onChange={(e) => handleChange('authType', e.target.value)}
                            >
                                <option value="Single">Single Factor</option>
                                <option value="MFA">MFA</option>
                            </select>
                        </div>

                        {formData.type === 'Terminal' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Isolation (VDI/RBI)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                                    value={formData.isolation || 'None'}
                                    onChange={(e) => handleChange('isolation', e.target.value)}
                                >
                                    <option value="None">None</option>
                                    <option value="VDI">VDI</option>
                                    <option value="RBI">RBI</option>
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isCDS"
                                checked={formData.isCDS || false}
                                onChange={(e) => handleChange('isCDS', e.target.checked)}
                            />
                            <label htmlFor="isCDS" className="text-sm font-medium text-gray-700">Is CDS (Cross Domain)?</label>
                        </div>



                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRegistered"
                                checked={formData.isRegistered || false}
                                onChange={(e) => handleChange('isRegistered', e.target.checked)}
                            />
                            <label htmlFor="isRegistered" className="text-sm font-medium text-gray-700">Is Registered Device?</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isStorageEncrypted"
                                checked={formData.isStorageEncrypted || false}
                                onChange={(e) => handleChange('isStorageEncrypted', e.target.checked)}
                            />
                            <label htmlFor="isStorageEncrypted" className="text-sm font-medium text-gray-700">Is Storage Encrypted?</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isManagement"
                                checked={formData.isManagement || false}
                                onChange={(e) => handleChange('isManagement', e.target.checked)}
                            />
                            <label htmlFor="isManagement" className="text-sm font-medium text-gray-700">Is Management Device?</label>
                        </div>

                        {formData.type === 'Mobile' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="hasMDM"
                                    checked={formData.hasMDM || false}
                                    onChange={(e) => handleChange('hasMDM', e.target.checked)}
                                />
                                <label htmlFor="hasMDM" className="text-sm font-medium text-gray-700">Has MDM?</label>
                            </div>
                        )}

                        {/* Data Assets Management */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Stored Data Assets</label>
                                <button
                                    onClick={addData}
                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                                >
                                    + Add Data
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(formData.storedData || []).map((data) => (
                                    <div key={data.id} className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-500">Data #{data.id}</span>
                                            <button
                                                onClick={() => removeData(data.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Grade</label>
                                                <select
                                                    className="w-full border-gray-300 rounded text-xs p-1"
                                                    value={data.grade}
                                                    onChange={(e) => updateData(data.id, 'grade', e.target.value)}
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="Sensitive">Sensitive</option>
                                                    <option value="Classified">Classified</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Type</label>
                                                <select
                                                    className="w-full border-gray-300 rounded text-xs p-1"
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
                                    <p className="text-xs text-gray-400 italic text-center py-2">No data stored.</p>
                                )}
                            </div>
                        </div>


                    </>
                )}

                {/* Edge Specific */}
                {isEdge && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Protocol</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
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

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isEncrypted"
                                checked={formData.isEncrypted || false}
                                onChange={(e) => handleChange('isEncrypted', e.target.checked)}
                            />
                            <label htmlFor="isEncrypted" className="text-sm font-medium text-gray-700">Is Encrypted?</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasCDR"
                                checked={formData.hasCDR || false}
                                onChange={(e) => handleChange('hasCDR', e.target.checked)}
                            />
                            <label htmlFor="hasCDR" className="text-sm font-medium text-gray-700">Has CDR?</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasDLP"
                                checked={formData.hasDLP || false}
                                onChange={(e) => handleChange('hasDLP', e.target.checked)}
                            />
                            <label htmlFor="hasDLP" className="text-sm font-medium text-gray-700">Has DLP?</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasAntiVirus"
                                checked={formData.hasAntiVirus || false}
                                onChange={(e) => handleChange('hasAntiVirus', e.target.checked)}
                            />
                            <label htmlFor="hasAntiVirus" className="text-sm font-medium text-gray-700">Has Anti-Virus?</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Carries Data</label>

                            {(() => {
                                const sourceNode = getNodes().find(n => n.id === selectedElement.source);
                                const availableData = sourceNode?.data?.storedData || [];

                                // Parse current carries data
                                const currentCarries = (formData.carries || '')
                                    .toString()
                                    .split(',')
                                    .map(x => parseInt(x.trim()))
                                    .filter(x => !isNaN(x));

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
                                    newCarries[indexToUpdate] = parseInt(newValue);
                                    handleChange('carries', newCarries.join(', '));
                                };

                                if (availableData.length === 0) {
                                    return (
                                        <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-200">
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
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
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
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remove"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={handleAddData}
                                            className="w-full py-1 text-xs border border-dashed border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
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
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                        onClick={handleDelete}
                        className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                        Delete {isEdge ? 'Connection' : 'Element'}
                    </button>
                </div>
            </div>
        );
    };

    const renderThreatsTab = () => {
        if (!analysisResult) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <p className="text-sm">No analysis performed yet.</p>
                    <p className="text-xs">Click "Analyze" to check for threats.</p>
                </div>
            );
        }

        const { total_count, threats } = analysisResult;
        const hasViolations = total_count > 0;

        if (!hasViolations) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <CheckCircle size={48} className="text-green-500 mb-2" />
                    <p className="text-lg font-medium text-green-700">Secure</p>
                    <p className="text-sm text-center">No security violations found.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4 p-1">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-red-600" size={20} />
                    <span className="font-bold text-red-700">{total_count} Violations Found</span>
                </div>
                {Object.entries(threats).map(([key, items]) => {
                    if (items.length === 0) return null;
                    return (
                        <div key={key} className="border border-red-100 rounded-lg overflow-hidden">
                            <div className="bg-red-50 px-3 py-2 border-b border-red-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <h4 className="font-semibold text-red-900 text-xs uppercase tracking-wide">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {items.map((item, idx) => {
                                    const uniqueId = `${key}-${idx}`;
                                    const isSelected = selectedThreatId === uniqueId;

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-2 transition-all duration-200 ease-in-out cursor-pointer active:scale-95 hover:shadow-sm border rounded-md m-1 ${isSelected
                                                ? 'bg-blue-50 border-blue-300 shadow-md'
                                                : 'hover:bg-red-50 border-transparent hover:border-red-200'
                                                }`}
                                            onClick={() => onThreatClick && onThreatClick(item, key, idx)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-gray-700 text-xs">Violation #{idx + 1}</span>
                                                {isSelected && (
                                                    <span className="text-blue-600 font-bold text-[10px] bg-blue-100 px-1.5 py-0.5 rounded-full">
                                                        선택됨
                                                    </span>
                                                )}
                                            </div>
                                            <ul className="space-y-1">
                                                {Object.entries(item).map(([k, v]) => (
                                                    <li key={k} className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{k}:</span>
                                                        <span className="text-gray-600 break-all pl-2">{v}</span>
                                                    </li>
                                                ))}
                                            </ul>
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
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'properties' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('properties')}
                >
                    Properties
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'threats' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
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
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'properties' ? renderPropertiesTab() : renderThreatsTab()}
            </div>
        </div>
    );
}
