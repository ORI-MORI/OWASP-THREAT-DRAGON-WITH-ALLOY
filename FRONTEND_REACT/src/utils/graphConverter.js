export function convertGraphToJSON(nodes, edges) {
    const zones = nodes.filter((n) => n.type === 'zone');
    const systems = nodes.filter((n) => n.type === 'system');

    // Helper to check intersection
    const isInside = (inner, outer) => {
        // Use measured dimensions if available, otherwise fallback to style or defaults
        const innerW = inner.width || inner.measured?.width || 150;
        const innerH = inner.height || inner.measured?.height || 150;
        const outerW = outer.width || outer.measured?.width || 300;
        const outerH = outer.height || outer.measured?.height || 300;

        return (
            inner.position.x >= outer.position.x &&
            inner.position.x + innerW <= outer.position.x + outerW &&
            inner.position.y >= outer.position.y &&
            inner.position.y + innerH <= outer.position.y + outerH
        );
    };

    // 1. Map Locations (Zones)
    let locations = zones.map((z, index) => ({
        id: index + 1,
        realId: z.id,
        type: z.data.type || 'Internet',
        grade: z.data.grade || 'Open',
    }));

    // If no zones exist, create a default Internet zone
    if (locations.length === 0) {
        locations.push({
            id: 1,
            realId: 'default-internet',
            type: 'Internet',
            grade: 'Open'
        });
    }

    // 2. Map Systems
    const mappedSystems = systems.map((s, index) => {
        let parentZone = null;
        const data = s.data || {};

        // 1. Check for manual override
        if (data.loc) {
            parentZone = locations.find(l => l.realId === data.loc);
        }

        // 2. Fallback to spatial detection if no override or override invalid
        if (!parentZone) {
            parentZone = locations.find((loc) => {
                const zoneNode = zones.find((z) => z.id === loc.realId);
                if (!zoneNode) return false;
                return isInside(s, zoneNode);
            });
        }

        const locationId = parentZone ? parentZone.id : (locations[0]?.id || 1);

        // Parse stored data (Array of objects from PropertyPanel)
        const storedData = data.storedData || [];
        const storesIds = storedData.map(d => d.id);

        return {
            // Spread raw data first
            ...data,

            id: index + 100, // Start from 100
            realId: s.id,
            loc: locationId,
            grade: data.grade || (parentZone ? parentZone.grade : 'Open'),
            type: data.type || 'Terminal',

            // Explicitly map security properties with safe defaults
            isCDS: data.isCDS === true, // Ensure boolean
            authType: data.authType || 'Single',
            isRegistered: data.isRegistered === true,
            isStorageEncrypted: data.isStorageEncrypted === true,
            isManagement: data.isManagement === true,
            isolation: data.isolation || 'None',
            hasMDM: data.hasMDM === true,

            stores: storesIds,
            _storedDataObjects: storedData, // Keep for data collection
        };
    });

    // 3. Map Connections (Edges)
    // 3. Map Connections (Edges)
    const connections = edges.flatMap((e, index) => {
        const fromSys = mappedSystems.find((s) => s.realId === e.source);
        const toSys = mappedSystems.find((s) => s.realId === e.target);
        const data = e.data || {};

        if (!fromSys || !toSys) return [];

        // Parse carries data
        const carriesStr = data.carries || '';
        let carries = [];

        if (Array.isArray(carriesStr)) {
            carries = carriesStr.map(x => parseInt(x));
        } else if (typeof carriesStr === 'string' && carriesStr.trim() !== '') {
            carries = carriesStr.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
        }

        const baseId = parseInt(e.id.replace(/\D/g, '')) || (1000 + index);
        const isBidirectional = data.isBidirectional !== false; // Default to true

        const forwardConnection = {
            ...data,
            id: baseId,
            from: fromSys.id,
            to: toSys.id,
            carries: carries,
            protocol: data.protocol || 'HTTPS',
            isEncrypted: data.isEncrypted === true,
            hasCDR: data.hasCDR === true,
            hasDLP: data.hasDLP === true,
            hasAntiVirus: data.hasAntiVirus === true,
            realId: e.id,
        };

        if (isBidirectional) {
            const backwardConnection = {
                ...forwardConnection,
                id: baseId + 50000, // Offset to avoid collision
                from: toSys.id,
                to: fromSys.id,
                // Backward connection carries same data? 
                // Usually return traffic might be different, but for simple modeling, 
                // we assume the channel allows data flow in both directions.
                // However, 'carries' usually implies specific data assets moving.
                // If A sends Data1 to B, does B send Data1 back to A? Probably not.
                // But the user said "양방향 으로 통신이 즉 데이터가 흐를 수 있다는 걸 의미하는데".
                // This implies the *capability* to flow.
                // If specific data is assigned to the edge, it's ambiguous if it flows both ways.
                // For now, let's assume the properties apply to the channel.
                // But 'carries' is specific payload.
                // If I assign Data1 to the edge, it means Data1 flows.
                // If bidirectional, does Data1 flow A->B AND B->A?
                // Let's assume yes for now to be safe (worst case analysis).
                realId: e.id,
            };
            return [forwardConnection, backwardConnection];
        }

        return [forwardConnection];
    });

    // 4. Collect Data definitions
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

    return {
        locations: locations.map(({ realId, ...rest }) => rest),
        systems: mappedSystems.map(({ realId, _storedDataObjects, ...rest }) => rest),
        connections: connections.map(({ realId, ...rest }) => rest),
        data: dataList,
        _mapping: {
            systems: mappedSystems,
            connections: connections
        }
    };
}
