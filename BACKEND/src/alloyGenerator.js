const fs = require('fs');
const path = require('path');

/**
 * Deterministic Template Engine for N2SF Alloy Generation
 * Maps JSON data strictly to the defined Alloy templates.
 */
const generateAlloyFile = (jsonData) => {
    console.log("Starting generateAlloyFile...");
    const alloyDir = path.join(process.cwd(), 'alloy');
    const templatePath = path.join(alloyDir, 'user_instance.als');
    console.log(`Template path: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
        console.error(`Template file not found at: ${templatePath}`);
        throw new Error(`Template file not found: ${templatePath}`);
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

    // [1. Zone 정의]
    console.log("Processing Zones...");
    let zoneContent = "";
    const validLocationIds = new Set();

    if (jsonData.locations && jsonData.locations.length > 0) {
        jsonData.locations.forEach(loc => {
            zoneContent += `one sig Location${loc.id} extends Location {}\n`;
            zoneContent += `fact { Location${loc.id}.grade = ${loc.grade} and Location${loc.id}.type = ${loc.type} }\n\n`;
            validLocationIds.add(String(loc.id));
        });
    }

    // [2. Data 정의]
    console.log("Processing Data...");
    let dataContent = "";
    if (jsonData.data && jsonData.data.length > 0) {
        jsonData.data.forEach(d => {
            dataContent += `one sig Data${d.id} extends Data {}\n`;
            dataContent += `fact { Data${d.id}.grade = ${d.grade} and Data${d.id}.fileType = ${d.fileType} }\n\n`;
        });
    }
    als = als.replace('// [Loop: data 배열을 순회하며 생성]', dataContent);

    // [3. System 정의] (Moved up logic to determine if Default Location is needed)
    console.log("Processing Systems...");
    let systemContent = "";
    let useDefaultLocation = false;

    if (jsonData.systems && jsonData.systems.length > 0) {
        jsonData.systems.forEach(sys => {
            const stores = formatList(sys.stores, 'Data');

            // Handle missing or invalid location
            let locId = sys.loc;
            if (!locId || !validLocationIds.has(String(locId))) {
                locId = 'Default';
                useDefaultLocation = true;
            }

            systemContent += `one sig System${sys.id} extends System {}\n`;
            systemContent += `fact {\n`;
            systemContent += `    System${sys.id}.grade = ${sys.grade}\n`;
            systemContent += `    System${sys.id}.loc = Location${locId}\n`;
            systemContent += `    System${sys.id}.type = ${sys.type}\n`;
            systemContent += `    System${sys.id}.authType = ${sys.authType}\n`;
            systemContent += `    System${sys.id}.isCDS = ${formatBoolean(sys.isCDS)}\n`;
            systemContent += `    System${sys.id}.isRegistered = ${formatBoolean(sys.isRegistered)}\n`;
            systemContent += `    System${sys.id}.stores = ${stores}\n`;
            systemContent += `}\n\n`;
        });
    }

    // If default location is needed, add it to zoneContent
    if (useDefaultLocation) {
        console.log("Adding Default Location (Internet/Open)...");
        zoneContent += `one sig LocationDefault extends Location {}\n`;
        zoneContent += `fact { LocationDefault.grade = Open and LocationDefault.type = Internet }\n\n`;
    }

    als = als.replace('// [Loop: locations 배열을 순회하며 생성]', zoneContent);
    als = als.replace('// [Loop: systems 배열을 순회하며 생성]', systemContent);

    // [4. Connection 정의]
    console.log("Processing Connections...");
    let connectionContent = "";
    if (jsonData.connections && jsonData.connections.length > 0) {
        jsonData.connections.forEach((conn, index) => {
            const connId = conn.id || index;
            const carries = formatList(conn.carries, 'Data');

            connectionContent += `one sig Connection${connId} extends Connection {}\n`;
            connectionContent += `fact {\n`;
            connectionContent += `    Connection${connId}.from = System${conn.from}\n`;
            connectionContent += `    Connection${connId}.to = System${conn.to}\n`;
            connectionContent += `    Connection${connId}.carries = ${carries}\n`;
            connectionContent += `    Connection${connId}.protocol = ${conn.protocol}\n`;
            connectionContent += `    Connection${connId}.isEncrypted = ${formatBoolean(conn.isEncrypted)}\n`;
            connectionContent += `    Connection${connId}.hasCDR = ${formatBoolean(conn.hasCDR)}\n`;
            connectionContent += `    Connection${connId}.hasAntiVirus = ${formatBoolean(conn.hasAntiVirus)}\n`;
            connectionContent += `}\n\n`;
        });
    }
    als = als.replace('// [Loop: connections 배열을 순회하며 생성]', connectionContent);

    // Output File Generation
    if (!fs.existsSync(alloyDir)) {
        fs.mkdirSync(alloyDir, { recursive: true });
    }

    const outputPath = path.join(alloyDir, 'user_instance_real.als');
    console.log(`Generating Alloy file at: ${outputPath} (CWD: ${process.cwd()})`);

    fs.writeFileSync(outputPath, als);
    console.log(`Alloy file generated successfully.`);
    return outputPath;
}

module.exports = { generateAlloyFile };
