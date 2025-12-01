import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../store';

export default function PropertyPanel({ analysisResult }) {
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
                                <option value="">(Auto-detect)</option>
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
                                id="isDeidentifier"
                                checked={formData.isDeidentifier || false}
                                onChange={(e) => handleChange('isDeidentifier', e.target.checked)}
                            />
                            <label htmlFor="isDeidentifier" className="text-sm font-medium text-gray-700">Is De-identifier?</label>
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
                                {items.map((item, idx) => (
                                    <div key={idx} className="p-2 hover:bg-gray-50 transition-colors text-xs text-gray-700">
                                        <ul className="space-y-1">
                                            {Object.entries(item).map(([k, v]) => (
                                                <li key={k} className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{k}:</span>
                                                    <span className="text-gray-600 break-all pl-2">{v}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
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
