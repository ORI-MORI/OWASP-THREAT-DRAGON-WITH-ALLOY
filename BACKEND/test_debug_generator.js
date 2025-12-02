const { generateAlloyFile } = require('./src/alloyGenerator');
const fs = require('fs');
const path = require('path');

const mockPayload = {
    locations: [{ id: 1, grade: 'Open', type: 'Internet' }],
    systems: [
        { id: 101, loc: 1, grade: 'Open', type: 'Server', stores: [], isCDS: false, isRegistered: false, isStorageEncrypted: false, isManagement: false, isolation: 'None', hasMDM: false },
        { id: 102, loc: 1, grade: 'Open', type: 'Terminal', stores: [], isCDS: false, isRegistered: false, isStorageEncrypted: false, isManagement: false, isolation: 'None', hasMDM: false }
    ],
    connections: [
        { id: 123, from: 101, to: 102, carries: [], protocol: 'HTTP', isEncrypted: false, hasCDR: false, hasDLP: false, hasAntiVirus: false }
    ]
};

try {
    const outputPath = generateAlloyFile(mockPayload);
    const content = fs.readFileSync(outputPath, 'utf8');
    console.log("Generated Content Snippet:");
    const lines = content.split('\n');
    lines.forEach(line => {
        if (line.includes('sig Connection')) {
            console.log(line);
        }
    });
} catch (e) {
    console.error(e);
}
