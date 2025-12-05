import React, { useRef } from 'react';
import { FileUp, Plus, LayoutTemplate } from 'lucide-react';
import model1 from '../data/presets/model1.json';

// Preset Registry
const PRESETS = [
    { id: 'model1', name: 'Model 1: Internet Terminal', data: model1 },
    // Add more presets here
];

export default function LandingPage({ onStartProject }) {
    const fileInputRef = useRef(null);

    const handleNewProject = () => {
        onStartProject(null); // Empty project
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Basic validation could go here
                onStartProject(json);
            } catch (error) {
                alert('Invalid JSON file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const handlePresetLoad = (preset) => {
        onStartProject(preset.data);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                        AMADEUS
                    </h1>
                    <p className="text-xl text-slate-500 font-light">
                        N2SF Threat Modeling & Security Analysis
                    </p>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* New Project */}
                    <button
                        onClick={handleNewProject}
                        className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Plus size={100} className="text-indigo-600" />
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">New Project</h3>
                        <p className="text-sm text-slate-500">Start with a blank canvas and build your model from scratch.</p>
                    </button>

                    {/* Load File */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileUp size={100} className="text-emerald-600" />
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                            <FileUp size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Load from File</h3>
                        <p className="text-sm text-slate-500">Restore a previously saved .json project file.</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json"
                            onChange={handleFileUpload}
                        />
                    </button>
                </div>

                {/* Presets Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">N2SF Standard Models</span>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetLoad(preset)}
                                className="bg-white/60 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 group"
                            >
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                    <LayoutTemplate size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-700 group-hover:text-indigo-700">{preset.name}</div>
                                    <div className="text-xs text-slate-400">Standard Template</div>
                                </div>
                            </button>
                        ))}

                        {/* Placeholder for more */}
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                            More models coming soon...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
