import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import useStore from '../store';

export default function PropertyPanel() {
    const { selectedElement, setSelectedElement } = useStore();
    const { setNodes, setEdges } = useReactFlow();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (selectedElement) {
            setFormData(selectedElement.data || {});
        } else {
            setFormData({});
        }
    }, [selectedElement]);

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

        // Update local selected element state to reflect changes immediately if needed
        // But better to rely on React Flow updates. 
        // However, selectedElement in store is a snapshot. We might need to update it too or just rely on re-selection.
        // Let's update the store copy too so the UI doesn't flicker.
        setSelectedElement({ ...selectedElement, data: newData });
    };

    if (!selectedElement) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 p-4">
                <div className="text-gray-500 text-sm">Select an element to edit properties.</div>
            </div>
        );
    }

    const isNode = !selectedElement.source;
    const isZone = isNode && selectedElement.type === 'zone';
    const isSystem = isNode && selectedElement.type === 'system';
    const isEdge = !!selectedElement.source;

    // Helper to update stored data list
    const addData = () => {
        const currentData = formData.storedData || [];
        const newId = currentData.length > 0 ? Math.max(...currentData.map(d => d.id)) + 1 : 1;
        const newDataItem = { id: newId, grade: 'Sensitive', fileType: 'Document' };
        handleChange('storedData', [...currentData, newDataItem]);
    };

    const removeData = (id) => {
        const currentData = formData.storedData || [];
        handleChange('storedData', currentData.filter(d => d.id !== id));
    };

    const updateData = (id, field, value) => {
        const currentData = formData.storedData || [];
        handleChange('storedData', currentData.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto h-full">
            <h2 className="text-lg font-bold border-b pb-2">Properties</h2>

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
                        </select>
                    </div>
                </>
            )}

            {/* System Specific */}
            {isSystem && (
                <>
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
                        </select>
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Auth Capability</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.authCapability || 'Single'}
                            onChange={(e) => handleChange('authCapability', e.target.value)}
                        >
                            <option value="Single">Single Factor</option>
                            <option value="MFA">MFA</option>
                        </select>
                    </div>

                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Stored Data</label>
                            <button onClick={addData} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                                + Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(formData.storedData || []).map((data, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold">ID: {data.id}</span>
                                        <button onClick={() => removeData(data.id)} className="text-red-500 hover:text-red-700">×</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        <select
                                            value={data.grade}
                                            onChange={(e) => updateData(data.id, 'grade', e.target.value)}
                                            className="border rounded p-0.5"
                                        >
                                            <option value="Classified">Classified</option>
                                            <option value="Sensitive">Sensitive</option>
                                            <option value="Open">Open</option>
                                        </select>
                                        <select
                                            value={data.fileType}
                                            onChange={(e) => updateData(data.id, 'fileType', e.target.value)}
                                            className="border rounded p-0.5"
                                        >
                                            <option value="Document">Document</option>
                                            <option value="Executable">Executable</option>
                                            <option value="Media">Media</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                            {(formData.storedData || []).length === 0 && (
                                <div className="text-gray-400 text-xs italic text-center py-2">No data stored</div>
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
                            value={formData.protocol || 'HTTP'}
                            onChange={(e) => handleChange('protocol', e.target.value)}
                        >
                            <option value="HTTPS">HTTPS</option>
                            <option value="SSH">SSH</option>
                            <option value="VPN_Tunnel">VPN Tunnel</option>
                            <option value="ClearText">ClearText</option>
                            <option value="SQL">SQL</option>
                        </select>
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
                            id="hasAntiVirus"
                            checked={formData.hasAntiVirus || false}
                            onChange={(e) => handleChange('hasAntiVirus', e.target.checked)}
                        />
                        <label htmlFor="hasAntiVirus" className="text-sm font-medium text-gray-700">Has AntiVirus?</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Carries Data (comma separated IDs)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.carries || ''}
                            onChange={(e) => handleChange('carries', e.target.value)}
                            placeholder="e.g. 1, 2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter IDs of data defined in Systems.</p>
                    </div>
                </>
            )}
        </div>
    );
}
