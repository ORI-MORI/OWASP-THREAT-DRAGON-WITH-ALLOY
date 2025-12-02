const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        // Paths
        // Use process.cwd() which is /app in Docker or local root
        const cwd = process.cwd();
        // Normalize paths to use forward slashes to avoid Windows shell escaping issues
        const normalizePath = (p) => p.replace(/\\/g, '/');

        const jarPath = normalizePath(path.join(cwd, 'alloy/alloy4.2_2015-02-22.jar'));
        // Use semicolon for Windows classpath separator (Local Execution)
        const classpath = `.;${jarPath}`;
        const runnerPath = normalizePath(path.join(cwd, 'src/AlloyRunner.java'));
        const normalizedFilePath = normalizePath(filePath);

        console.log(`Execution Context: CWD=${cwd}, JAR=${jarPath}, Runner=${runnerPath}, File=${normalizedFilePath}`);

        // 1. Compile
        const compileCmd = `javac -cp "${classpath}" "${runnerPath}"`;

        console.log(`Compiling: ${compileCmd}`);
        exec(compileCmd, { cwd: cwd }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                console.error(`Compilation error: ${compileError}`);
                return resolve({ success: false, error: compileStderr || compileError.message });
            }

            // 2. Execute
            // Added 'src' to classpath for java execution because AlloyRunner.class is in src/ folder
            // Use semicolon for Windows
            const runCmd = `java -cp "src;${classpath}" AlloyRunner "${normalizedFilePath}"`;

            console.log(`Executing: ${runCmd}`);
            exec(runCmd, { cwd: cwd }, (runError, runStdout, runStderr) => {
                if (runError) {
                    console.error(`Execution error: ${runError}`);
                    return resolve({ success: false, error: runStderr || runError.message });
                }

                console.log(`stdout: ${runStdout}`);

                // Parse XML
                const xmlPath = filePath.replace('.als', '.xml');
                if (fs.existsSync(xmlPath)) {
                    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

                    const violations = parseAlloyXML(xmlContent);
                    resolve({ success: true, result: violations });
                } else {
                    resolve({ success: false, error: "XML output not found" });
                }
            });
        });
    });
}

function parseAlloyXML(xml) {
    const threats = {};
    let total_count = 0;

    // 1. Parse XML to build in-memory graph
    const atoms = {}; // ID -> Label
    const relations = {}; // RelationName -> Array of Tuples (Arrays of IDs)

    // Helper to clean label
    const cleanLabel = (l) => {
        if (!l) return '';
        return l.split('/').pop().split('$')[0];
    };

    // Data Store
    const model = {
        locations: {}, // id -> { grade, type }
        systems: {},   // id -> { grade, loc, type, authType, isCDS, isRegistered, stores: [] }
        connections: {}, // id -> { from, to, carries: [], protocol, isEncrypted, hasCDR, hasAntiVirus }
        data: {}       // id -> { grade, fileType }
    };

    // Regex for Fields
    const fieldRegex = /<field label="([^"]+)"[^>]*>([\s\S]*?)<\/field>/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(xml)) !== null) {
        const fieldName = fieldMatch[1];
        const content = fieldMatch[2];
        const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
        let tupleMatch;

        while ((tupleMatch = tupleRegex.exec(content)) !== null) {
            const tupleContent = tupleMatch[1];
            const atomRegex = /<atom label="([^"]+)"\/>/g;
            const tupleAtoms = [];
            let am;
            while ((am = atomRegex.exec(tupleContent)) !== null) {
                tupleAtoms.push(cleanLabel(am[1]));
            }

            // Populate Model based on Field Name
            // tupleAtoms[0] is usually the subject
            const subject = tupleAtoms[0];

            if (fieldName === 'grade') {
                // Could be Location, System, or Data
                const grade = tupleAtoms[1];
                if (subject.startsWith('Location')) {
                    if (!model.locations[subject]) model.locations[subject] = {};
                    model.locations[subject].grade = grade;
                } else if (subject.startsWith('System')) {
                    if (!model.systems[subject]) model.systems[subject] = {};
                    model.systems[subject].grade = grade;
                } else if (subject.startsWith('Data')) {
                    if (!model.data[subject]) model.data[subject] = {};
                    model.data[subject].grade = grade;
                }
            } else if (fieldName === 'type') {
                // Location or System
                const type = tupleAtoms[1];
                if (subject.startsWith('Location')) {
                    if (!model.locations[subject]) model.locations[subject] = {};
                    model.locations[subject].type = type;
                } else if (subject.startsWith('System')) {
                    if (!model.systems[subject]) model.systems[subject] = {};
                    model.systems[subject].type = type;
                }
            } else if (fieldName === 'fileType') {
                if (!model.data[subject]) model.data[subject] = {};
                model.data[subject].fileType = tupleAtoms[1];
            } else if (fieldName === 'loc') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].loc = tupleAtoms[1];
            } else if (fieldName === 'authType') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].authType = tupleAtoms[1];
            } else if (fieldName === 'isCDS') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isCDS = tupleAtoms[1] === 'True';
            } else if (fieldName === 'isRegistered') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isRegistered = tupleAtoms[1] === 'True';
            } else if (fieldName === 'stores') {
                if (!model.systems[subject]) model.systems[subject] = {};
                if (!model.systems[subject].stores) model.systems[subject].stores = [];
                model.systems[subject].stores.push(tupleAtoms[1]);
            } else if (fieldName === 'from') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].from = tupleAtoms[1];
            } else if (fieldName === 'to') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].to = tupleAtoms[1];
            } else if (fieldName === 'carries') {
                if (!model.connections[subject]) model.connections[subject] = {};
                if (!model.connections[subject].carries) model.connections[subject].carries = [];
                model.connections[subject].carries.push(tupleAtoms[1]);
            } else if (fieldName === 'protocol') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].protocol = tupleAtoms[1];
            } else if (fieldName === 'isEncrypted') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].isEncrypted = tupleAtoms[1] === 'True';
            } else if (fieldName === 'hasCDR') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].hasCDR = tupleAtoms[1] === 'True';
            } else if (fieldName === 'hasAntiVirus') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].hasAntiVirus = tupleAtoms[1] === 'True';
            }
        }
    }

    // Helper for Grade Comparison (Open < Sensitive < Classified)
    const gradeOrder = { 'Open': 0, 'Sensitive': 1, 'Classified': 2 };
    const lt = (g1, g2) => gradeOrder[g1] < gradeOrder[g2];

    // Initialize Threats
    const engines = [
        'StorageViolations', 'FlowViolations', 'LocationViolations',
        'BypassViolations', 'UnencryptedChannels', 'AuthIntegrityGaps',
        'ContentControlFailures'
    ];
    engines.forEach(key => threats[key] = []);

    // 2. Execute Logic (JS Implementation of Alloy Rules)

    // 1. Storage Violation: System Grade < Data Grade
    Object.entries(model.systems).forEach(([sysId, sys]) => {
        if (sys.stores) {
            sys.stores.forEach(dataId => {
                const data = model.data[dataId];
                if (data && lt(sys.grade, data.grade)) {
                    threats['StorageViolations'].push({
                        system: sysId,
                        data: dataId,
                        remediation: "시스템의 보안 등급을 상향하거나, 해당 데이터를 더 높은 등급의 시스템으로 이동하십시오."
                    });
                    total_count++;
                }
            });
        }
    });

    // 2. Flow Violation: Dest Grade < Data Grade (unless Dest is CDS)
    Object.entries(model.connections).forEach(([connId, conn]) => {
        if (conn.carries) {
            conn.carries.forEach(dataId => {
                const data = model.data[dataId];
                const destSys = model.systems[conn.to];
                if (data && destSys && lt(destSys.grade, data.grade) && !destSys.isCDS) {
                    threats['FlowViolations'].push({
                        connection: connId,
                        data: dataId,
                        remediation: "해당 경로에 CDS(망연계 솔루션)를 배치하거나 전송을 차단하십시오."
                    });
                    total_count++;
                }
            });
        }
    });

    // 3. Location Violation: Zone Grade < System Grade
    Object.entries(model.systems).forEach(([sysId, sys]) => {
        const zone = model.locations[sys.loc];
        if (zone && lt(zone.grade, sys.grade)) {
            threats['LocationViolations'].push({
                system: sysId,
                remediation: "시스템을 적절한 보안 등급의 망(Zone)으로 이동시키십시오."
            });
            total_count++;
        }
    });

    // 4. Bypass Violation: Internet -> Intranet direct connection without CDS
    Object.entries(model.connections).forEach(([connId, conn]) => {
        const srcSys = model.systems[conn.from];
        const destSys = model.systems[conn.to];
        if (srcSys && destSys) {
            const srcZone = model.locations[srcSys.loc];
            const destZone = model.locations[destSys.loc];

            if (srcZone && destZone &&
                srcZone.type === 'Internet' &&
                destZone.type === 'Intranet' &&
                !destSys.isCDS) {
                threats['BypassViolations'].push({
                    connection: connId,
                    remediation: "인터넷망에서 내부망으로의 직접 연결을 제거하고, 반드시 CDS를 경유하도록 구성하십시오."
                });
                total_count++;
            }
        }
    });

    // 5. Unencrypted Channel: (Internet or Wireless) AND (ClearText or !isEncrypted)
    Object.entries(model.connections).forEach(([connId, conn]) => {
        const srcSys = model.systems[conn.from];
        const destSys = model.systems[conn.to];
        if (srcSys && destSys) {
            const srcZone = model.locations[srcSys.loc];
            const destZone = model.locations[destSys.loc];

            const isRiskyZone = (z) => z && (z.type === 'Internet' || z.type === 'Wireless');

            if ((isRiskyZone(srcZone) || isRiskyZone(destZone)) &&
                (conn.protocol === 'ClearText' || !conn.isEncrypted)) {
                threats['UnencryptedChannels'].push({
                    connection: connId,
                    remediation: "해당 구간의 통신 프로토콜을 암호화된 프로토콜(HTTPS, SSH, VPN 등)로 변경하십시오."
                });
                total_count++;
            }
        }
    });

    // 6. Auth Integrity Gap: (Sensitive or Classified) AND (Single Auth or !isRegistered)
    Object.entries(model.systems).forEach(([sysId, sys]) => {
        if (sys.grade === 'Sensitive' || sys.grade === 'Classified') {
            if (sys.authType === 'Single' || !sys.isRegistered) {
                threats['AuthIntegrityGaps'].push({
                    system: sysId,
                    remediation: "해당 시스템에 다중 인증(MFA)을 적용하고 자산 대장에 등록하십시오."
                });
                total_count++;
            }
        }
    });

    // 7. Content Control Failure: Document AND Zone Change AND !hasCDR
    Object.entries(model.connections).forEach(([connId, conn]) => {
        if (conn.carries) {
            const srcSys = model.systems[conn.from];
            const destSys = model.systems[conn.to];

            if (srcSys && destSys && srcSys.loc !== destSys.loc) { // Zone Change
                conn.carries.forEach(dataId => {
                    const data = model.data[dataId];
                    if (data && data.fileType === 'Document' && !conn.hasCDR) {
                        threats['ContentControlFailures'].push({
                            connection: connId,
                            data: dataId,
                            remediation: "망 간 이동 시 문서 파일에 대해 CDR(콘텐츠 무해화) 솔루션을 적용하십시오."
                        });
                        total_count++;
                    }
                });
            }
        }
    });

    return { threats, total_count };
}

module.exports = { executeAlloy };
