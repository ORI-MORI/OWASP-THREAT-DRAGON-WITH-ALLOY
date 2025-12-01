import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const ZoneNode = ({ data, selected }) => {
    return (
        <>
            <NodeResizer
                minWidth={100}
                minHeight={100}
                isVisible={selected}
                lineClassName="border-blue-400"
                handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded"
            />
            <div className={`h-full w-full min-w-[100px] min-h-[100px] border-2 border-dashed rounded-lg bg-gray-50/50 p-4 transition-colors ${selected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-400'}`}>
                <div className="font-bold text-gray-500 uppercase text-xs mb-2">{data.label}</div>
                <div className="text-xs text-gray-400">Grade: {data.grade || 'Open'}</div>
            </div>
        </>
    );
};

export default memo(ZoneNode);
