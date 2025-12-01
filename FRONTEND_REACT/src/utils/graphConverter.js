export function convertGraphToJSON(nodes, edges) {
    const zones = nodes.filter((n) => n.type === 'zone');
    const systems = nodes.filter((n) => n.type === 'system');

    // Helper to check intersection
    const isInside = (inner, outer) => {
        const innerW = inner.width || 100;
        const innerH = inner.height || 100;
        const outerW = outer.width || 200;
        const outerH = outer.height || 200;

        return (
            inner.position.x >= outer.position.x &&
            inner.position.x + innerW <= outer.position.x + outerW &&
            inner.position.y >= outer.position.y &&
            inner.position.y + innerH <= outer.position.y + outerH
        );
    };

    // 1. Map Locations (Zones)
    const locations = zones.map((z, index) => ({
        id: index + 1,
        realId: z.id,
        type: z.data.type || 'Internet',
        grade: z.data.grade || 'Open',
    }));

    // 2. Map Systems
    const mappedSystems = systems.map((s, index) => {
        // Find parent zone
        const parentZone = locations.find((loc) => {
            const zoneNode = zones.find((z) => z.id === loc.realId);
            return isInside(s, zoneNode);
        });

        const locationId = parentZone ? parentZone.id : (locations[0]?.id || 1);

        // Parse stored data (Array of objects from PropertyPanel)
        const storedData = s.data.storedData || [];
        const storesIds = storedData.map(d => d.id);

        return {
            id: index + 100, // Start from 100
            realId: s.id,
            location: locationId,
            grade: s.data.grade || (parentZone ? parentZone.grade : 'Open'),
            type: s.data.type || 'Server',
            isCDS: s.data.isCDS || false,
            authCapability: s.data.authCapability || 'Single',
            isRegistered: s.data.isRegistered || false,
            stores: storesIds,
            _storedDataObjects: storedData // Keep for data collection
        };
    });

    // 3. Map Connections (Edges)
    const connections = edges.map((e) => {
        const fromSys = mappedSystems.find((s) => s.realId === e.source);
        const toSys = mappedSystems.find((s) => s.realId === e.target);

        if (!fromSys || !toSys) return null;

        // Parse carries data
        const carriesStr = e.data?.carries || '';
        const carries = carriesStr.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));

        return {
            from: fromSys.id,
            to: toSys.id,
            carries: carries,
            protocol: e.data?.protocol || 'HTTPS',
            hasCDR: e.data?.hasCDR || false,
            hasAntiVirus: e.data?.hasAntiVirus || false,
            realId: e.id
        };
    }).filter(c => c !== null);

    // 4. Collect Data definitions
    // Iterate over all systems and collect unique data objects defined in 'storedData'
    const allDataMap = new Map();

    mappedSystems.forEach(s => {
        if (s._storedDataObjects) {
            s._storedDataObjects.forEach(d => {
                if (!allDataMap.has(d.id)) {
                    allDataMap.set(d.id, {
                        id: d.id,
                        grade: d.grade || 'Sensitive',
                        fileType: d.fileType || 'Document'
                    });
                }
            });
        }
    });

    // Also check connections for any data IDs that might be missing definitions (fallback)
    connections.forEach(c => {
        c.carries.forEach(id => {
            if (!allDataMap.has(id)) {
                allDataMap.set(id, {
                    id: id,
                    grade: 'Sensitive', // Default fallback
                    fileType: 'Document' // Default fallback
                });
            }
        });
    });

    const dataList = Array.from(allDataMap.values());

    // Remove temporary helper field
    const finalSystems = mappedSystems.map(({ _storedDataObjects, ...rest }) => rest);

    return {
        locations: locations.map(({ realId, ...rest }) => rest),
        systems: finalSystems.map(({ realId, ...rest }) => rest),
        connections: connections.map(({ realId, ...rest }) => rest),
        data: dataList,
        _mapping: {
            systems: mappedSystems,
            connections: connections
        }
    };
}
