const fs = require('fs');
const path = require('path');

/**
 * Deterministic Template Engine for N2SF Alloy Generation
 * Maps JSON data strictly to the defined Alloy templates.
 * 
 * [Implementation Principles]
 * 1. Enum Mapping: JSON strings must map to Alloy Enum Atoms (e.g., "HTTPS" -> HTTPS).
 * 2. Set Operations: Arrays must be joined with '+' or become 'none' if empty.
 * 3. Boolean Conversion: JSON true/false -> Alloy True/False (Atoms).
 */
const generateAlloyFile = (jsonData) => {
    console.log("Starting generateAlloyFile...");
    // Use __dirname to resolve path relative to this script (src/alloyGenerator.js)
    // alloy folder is at ../alloy
    const alloyDir = path.join(__dirname, '..', 'alloy');
    const templatePath = path.join(alloyDir, 'user_instance.als');
    const outputPath = path.join(alloyDir, 'user_instance_real.als');
    console.log(`Template path: ${templatePath}`);

    console.log(`Current Working Directory: ${process.cwd()}`);
    console.log(`Constructed Template Path: ${templatePath}`);
    console.log(`File exists? ${fs.existsSync(templatePath)}`);

    if (!fs.existsSync(templatePath)) {
        console.error(`Template file not found at: ${templatePath}`);
        throw new Error(`Template file not found: ${templatePath}`);
    }

    // [Clean up] Delete existing file if it exists
    if (fs.existsSync(outputPath)) {
        try {
            fs.unlinkSync(outputPath);
            console.log(`Existing file deleted: ${outputPath}`);
        } catch (err) {
            console.error(`Failed to delete existing file: ${err.message}`);
        }
    }

    let als = fs.readFileSync(templatePath, 'utf8');
    console.log("Template read successfully.");

    // 0. Update Module Name
    als = als.replace(/module\s+user_instance/, 'module user_instance_real');

    // Helper Functions
    const formatBoolean = (val) => val ? 'True' : 'False';

    const formatList = (list, prefix = '') => {
        if (!list || list.length === 0) return 'none';
        return list.map(item => prefix ? `${prefix}${item}` : item).join(' + ');
    };

    let zonesCode = "";
    let dataCode = "";
    let systemsCode = "";
    let connectionsCode = "";

    // [1. Zone 정의]
    console.log("Processing Zones...");
    if (jsonData.locations && jsonData.locations.length > 0) {
        jsonData.locations.forEach(loc => {
            zonesCode += `one sig Location${loc.id} extends Location {}\n`;
            zonesCode += `fact { Location${loc.id}.grade = ${loc.grade} and Location${loc.id}.type = ${loc.type} }\n\n`;
        });
    }

    // [2. Data 정의]
    console.log("Processing Data...");
    if (jsonData.data && jsonData.data.length > 0) {
        jsonData.data.forEach(d => {
            dataCode += `one sig Data${d.id} extends Data {}\n`;
            dataCode += `fact { Data${d.id}.grade = ${d.grade} and Data${d.id}.fileType = ${d.fileType} }\n\n`;
        });
    }

    // [3. System 정의]
    console.log("Processing Systems...");
    if (jsonData.systems && jsonData.systems.length > 0) {
        jsonData.systems.forEach(sys => {
            // List Handling: stores -> Data1 + Data2
            const stores = formatList(sys.stores, 'Data');

            // Enum Handling
            const isolation = sys.isolation || 'None';
            const authType = sys.authType || 'Single';
            const grade = sys.grade || 'Open';
            const type = sys.type || 'Server';

            systemsCode += `one sig System${sys.id} extends System {}\n`;
            systemsCode += `fact {\n`;
            systemsCode += `    System${sys.id}.grade = ${grade}\n`;
            systemsCode += `    System${sys.id}.loc = Location${sys.loc || sys.location}\n`;
            systemsCode += `    System${sys.id}.type = ${type}\n`;
            systemsCode += `    System${sys.id}.authType = ${authType}\n`;

            // Boolean Properties
            systemsCode += `    System${sys.id}.isCDS = ${formatBoolean(sys.isCDS)}\n`;
            systemsCode += `    System${sys.id}.isRegistered = ${formatBoolean(sys.isRegistered)}\n`;
            systemsCode += `    System${sys.id}.isStorageEncrypted = ${formatBoolean(sys.isStorageEncrypted)}\n`;
            systemsCode += `    System${sys.id}.isManagement = ${formatBoolean(sys.isManagement)}\n`;
            systemsCode += `    System${sys.id}.isolation = ${isolation}\n`;
            systemsCode += `    System${sys.id}.hasMDM = ${formatBoolean(sys.hasMDM)}\n`;

            // Set Relation
            systemsCode += `    System${sys.id}.stores = ${stores}\n`;
            systemsCode += `}\n\n`;
        });
    }

    // [4. Connection 정의]
    console.log("Processing Connections...");
    if (jsonData.connections && jsonData.connections.length > 0) {
        jsonData.connections.forEach((conn, index) => {
            const connId = conn.id || index;

            // List Handling: carries -> Data1 + Data2
            const carries = formatList(conn.carries, 'Data');

            // Enum Handling
            // If protocol is 'HTTP' (from user input guide), map to 'ClearText', otherwise use value
            let protocol = conn.protocol || 'HTTPS';
            if (protocol === 'HTTP') protocol = 'ClearText';

            connectionsCode += `one sig Connection${connId} extends Connection {}\n`;
            connectionsCode += `fact {\n`;
            connectionsCode += `    Connection${connId}.from = System${conn.from}\n`;
            connectionsCode += `    Connection${connId}.to = System${conn.to}\n`;
            connectionsCode += `    Connection${connId}.carries = ${carries}\n`;
            connectionsCode += `    Connection${connId}.protocol = ${protocol}\n`;

            // Boolean Properties
            connectionsCode += `    Connection${connId}.isEncrypted = ${formatBoolean(conn.isEncrypted)}\n`;
            connectionsCode += `    Connection${connId}.hasCDR = ${formatBoolean(conn.hasCDR)}\n`;
            connectionsCode += `    Connection${connId}.hasDLP = ${formatBoolean(conn.hasDLP)}\n`;
            connectionsCode += `    Connection${connId}.hasAntiVirus = ${formatBoolean(conn.hasAntiVirus)}\n`;
            connectionsCode += `}\n\n`;
        });
    }

    // [5. AnalysisResult 정의]
    let analysisResultCode = "";
    analysisResultCode += `// ============================================================\n`;
    analysisResultCode += `// [GENERATED] 결과 집합 (Analysis Result)\n`;
    analysisResultCode += `// ============================================================\n\n`;
    analysisResultCode += `one sig AnalysisResult {\n`;
    analysisResultCode += `    FindStorageViolations: set System -> Data,\n`;
    analysisResultCode += `    FindFlowViolations: set Connection -> Data,\n`;
    analysisResultCode += `    FindLocationViolations: set System,\n`;
    analysisResultCode += `    FindBypassViolations: set Connection,\n`;
    analysisResultCode += `    FindUnencryptedChannels: set Connection,\n`;
    analysisResultCode += `    FindAuthIntegrityGaps: set System,\n`;
    analysisResultCode += `    FindContentControlFailures: set Connection -> Data,\n`;
    analysisResultCode += `    FindUnencryptedStorage: set System -> Data,\n`;
    analysisResultCode += `    FindAdminAccessViolation: set Connection\n`;
    analysisResultCode += `}\n\n`;

    analysisResultCode += `fact DefineAnalysisResult {\n`;
    analysisResultCode += `    AnalysisResult.FindStorageViolations = FindStorageViolations\n`;
    analysisResultCode += `    AnalysisResult.FindFlowViolations = FindFlowViolations\n`;
    analysisResultCode += `    AnalysisResult.FindLocationViolations = FindLocationViolations\n`;
    analysisResultCode += `    AnalysisResult.FindBypassViolations = FindBypassViolations\n`;
    analysisResultCode += `    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels\n`;
    analysisResultCode += `    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps\n`;
    analysisResultCode += `    AnalysisResult.FindContentControlFailures = FindContentControlFailures\n`;
    analysisResultCode += `    AnalysisResult.FindUnencryptedStorage = FindUnencryptedStorage\n`;
    analysisResultCode += `    AnalysisResult.FindAdminAccessViolation = FindAdminAccessViolation\n`;
    analysisResultCode += `}\n\n`;
    // Inject generated content into the template
    als = als.replace('// [ZONES_HERE]', zonesCode);
    als = als.replace('// [DATA_HERE]', dataCode);
    als = als.replace('// [SYSTEMS_HERE]', systemsCode);
    als = als.replace('// [CONNECTIONS_HERE]', connectionsCode);

    // Append AnalysisResult and run command at the end
    als += '\n' + analysisResultCode + '\nrun CheckViolations { some AnalysisResult }\n';

    fs.writeFileSync(outputPath, als);
    console.log(`Alloy file generated successfully at ${outputPath}`);
    return outputPath;
}

module.exports = { generateAlloyFile };
