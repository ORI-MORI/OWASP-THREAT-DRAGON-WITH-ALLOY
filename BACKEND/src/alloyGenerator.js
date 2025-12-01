const fs = require('fs');
const path = require('path');

function generateAlloyFile(jsonData) {
    let alloyContent = `module user_instance
open n2sf_rules

`;

    // 1. Locations
    if (jsonData.locations && jsonData.locations.length > 0) {
        alloyContent += `one sig ${jsonData.locations.map(l => 'Location' + l.id).join(', ')} extends Location {}\n`;

        // Location Facts
        jsonData.locations.forEach(loc => {
            alloyContent += `fact { Location${loc.id}.id = ${loc.id} and Location${loc.id}.type = ${loc.type} and Location${loc.id}.grade = ${loc.grade} }\n`;
        });
        // Close the set
        alloyContent += `fact { Location = ${jsonData.locations.map(l => 'Location' + l.id).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no Location }\n`;
    }
    alloyContent += '\n';

    // 2. Data
    if (jsonData.data && jsonData.data.length > 0) {
        alloyContent += `one sig ${jsonData.data.map(d => 'Data' + d.id).join(', ')} extends Data {}\n`;

        // Data Facts
        jsonData.data.forEach(d => {
            alloyContent += `fact { Data${d.id}.id = ${d.id} and Data${d.id}.grade = ${d.grade} and Data${d.id}.fileType = ${d.fileType} }\n`;
        });
        // Close the set
        alloyContent += `fact { Data = ${jsonData.data.map(d => 'Data' + d.id).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no Data }\n`;
    }
    alloyContent += '\n';

    // 3. Systems
    if (jsonData.systems && jsonData.systems.length > 0) {
        alloyContent += `one sig ${jsonData.systems.map(s => 'System' + s.id).join(', ')} extends System {}\n`;

        // System Facts
        jsonData.systems.forEach(sys => {
            const stores = sys.stores && sys.stores.length > 0 ? sys.stores.map(id => `Data${id}`).join(' + ') : 'none';
            alloyContent += `fact { 
    System${sys.id}.id = ${sys.id} 
    System${sys.id}.location = Location${sys.location} 
    System${sys.id}.grade = ${sys.grade} 
    System${sys.id}.type = ${sys.type} 
    System${sys.id}.isCDS = ${sys.isCDS ? 'True' : 'False'} 
    System${sys.id}.authCapability = ${sys.authCapability} 
    System${sys.id}.isRegistered = ${sys.isRegistered ? 'True' : 'False'} 
    System${sys.id}.stores = ${stores} 
}\n`;
        });
        // Close the set
        alloyContent += `fact { System = ${jsonData.systems.map(s => 'System' + s.id).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no System }\n`;
    }
    alloyContent += '\n';

    // 4. Connections
    if (jsonData.connections && jsonData.connections.length > 0) {
        alloyContent += `one sig ${jsonData.connections.map((c, i) => 'Connection' + (c.id || i)).join(', ')} extends Connection {}\n`;

        // Connection Facts
        jsonData.connections.forEach((conn, index) => {
            const connId = conn.id || index;
            const carries = conn.carries && conn.carries.length > 0 ? conn.carries.map(id => `Data${id}`).join(' + ') : 'none';
            alloyContent += `fact { 
    Connection${connId}.from = System${conn.from} 
    Connection${connId}.to = System${conn.to} 
    Connection${connId}.carries = ${carries} 
    Connection${connId}.protocol = ${conn.protocol} 
    Connection${connId}.hasCDR = ${conn.hasCDR ? 'True' : 'False'} 
    Connection${connId}.hasAntiVirus = ${conn.hasAntiVirus ? 'True' : 'False'} 
}\n`;
        });
        // Close the set
        alloyContent += `fact { Connection = ${jsonData.connections.map((c, i) => 'Connection' + (c.id || i)).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no Connection }\n`;
    }

    // Add AnalysisResult sig to capture violations
    alloyContent += `
one sig AnalysisResult {
    FindStorageViolations: set System -> Data,
    FindFlowViolations: set Connection -> Data,
    FindLocationViolations: set System,
    FindBypassViolations: set Connection,
    FindUnencryptedChannels: set Connection,
    FindAuthIntegrityGaps: set System,
    FindContentControlFailures: set Connection -> Data,
    FindUnauthorizedDevices: set System
}

fact {
    AnalysisResult.FindStorageViolations = FindStorageViolations
    AnalysisResult.FindFlowViolations = FindFlowViolations
    AnalysisResult.FindLocationViolations = FindLocationViolations
    AnalysisResult.FindBypassViolations = FindBypassViolations
    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels
    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps
    AnalysisResult.FindContentControlFailures = FindContentControlFailures
    AnalysisResult.FindUnauthorizedDevices = FindUnauthorizedDevices
}

run CheckViolations { some AnalysisResult }
`;

    const outputPath = path.join(__dirname, '../../alloy/user_instance.als');
    fs.writeFileSync(outputPath, alloyContent);
    console.log(`Alloy file generated at: ${outputPath}`);
    return outputPath;
}

module.exports = { generateAlloyFile };
