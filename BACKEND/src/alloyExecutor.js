const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        // Paths
        const cwd = process.cwd();
        const normalizePath = (p) => p.replace(/\\/g, '/');

        const jarPath = normalizePath(path.join(cwd, 'alloy/alloy4.2_2015-02-22.jar'));
        const classpath = `.;${jarPath}`;
        const runnerPath = normalizePath(path.join(cwd, 'src/AlloyRunner.java'));
        const normalizedFilePath = normalizePath(filePath);
        const xmlPath = filePath.replace('.als', '.xml');

        console.log(`Execution Context: CWD=${cwd}, JAR=${jarPath}, Runner=${runnerPath}, File=${normalizedFilePath}`);

        // [Clean up] Delete existing XML file if it exists
        if (fs.existsSync(xmlPath)) {
            try {
                fs.unlinkSync(xmlPath);
                console.log(`Existing XML file deleted: ${xmlPath}`);
            } catch (err) {
                console.error(`Failed to delete existing XML file: ${err.message}`);
            }
        }

        // 1. Compile
        const compileCmd = `javac -cp "${classpath}" "${runnerPath}"`;

        console.log(`Compiling: ${compileCmd}`);
        exec(compileCmd, { cwd: cwd, maxBuffer: 1024 * 1024 * 10 }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                console.error(`Compilation error: ${compileError}`);
                return resolve({ success: false, error: compileStderr || compileError.message });
            }

            // 2. Execute
            const runCmd = `java -cp "src;${classpath}" AlloyRunner "${normalizedFilePath}"`;

            console.log(`Executing: ${runCmd}`);
            exec(runCmd, { cwd: cwd, maxBuffer: 1024 * 1024 * 10 }, (runError, runStdout, runStderr) => {
                if (runError) {
                    console.error(`Execution error: ${runError}`);
                    return resolve({ success: false, error: runStderr || runError.message });
                }

                console.log(`stdout: ${runStdout}`);

                // Parse XML
                if (fs.existsSync(xmlPath)) {
                    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
                    const violations = parseAlloyXML(xmlContent);

                    // Log final result to file
                    const result = violations; // parseAlloyXML returns { threats, total_count }

                    try {
                        fs.writeFileSync('debug_result.json', JSON.stringify(result, null, 2));
                        console.log("Final Result Saved to debug_result.json");
                    } catch (e) {
                        console.error("Failed to write debug_result.json", e);
                    }

                    resolve({ success: true, result });
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

    // Helper to clean label
    const cleanLabel = (l) => {
        if (!l) return '';
        // Handle cases like "n2sf_base/Connection$1" or "Connection123$0"
        const parts = l.split('/');
        let lastPart = parts[parts.length - 1];
        lastPart = lastPart.split('$')[0];

        // Strip prefixes added by alloyGenerator.js
        if (lastPart.startsWith('System') && lastPart.length > 6) return lastPart.substring(6);
        if (lastPart.startsWith('Location') && lastPart.length > 8) return lastPart.substring(8);
        if (lastPart.startsWith('Connection') && lastPart.length > 10) return lastPart.substring(10);
        if (lastPart.startsWith('Data') && lastPart.length > 4) return lastPart.substring(4);

        return lastPart;
    };

    // Initialize Threats
    const engines = [
        'FindStorageViolations', 'FindFlowViolations', 'FindLocationViolations',
        'FindBypassViolations', 'FindUnencryptedChannels', 'FindAuthIntegrityGaps',
        'FindContentControlFailures', 'FindUnencryptedStorage', 'FindAdminAccessViolation'
    ];
    engines.forEach(key => threats[key] = []);

    // Map Alloy Function Names to Remediation Messages
    const threatConfig = {
        'FindStorageViolations': {
            msg: "시스템의 보안 등급을 상향하거나, 해당 데이터를 더 높은 등급의 시스템으로 이동하십시오.",
            type: 'SystemData'
        },
        'FindFlowViolations': {
            msg: "해당 경로에 CDS를 배치하거나, 출발지에 VDI/RBI 등 망분리 기술을 적용하십시오.",
            type: 'ConnectionData'
        },
        'FindLocationViolations': {
            msg: "시스템을 적절한 보안 등급의 망(Zone)으로 이동시키십시오.",
            type: 'System'
        },
        'FindBypassViolations': {
            msg: "인터넷망에서 내부망으로의 직접 연결을 제거하고, 반드시 CDS를 경유하도록 구성하십시오.",
            type: 'Connection'
        },
        'FindUnencryptedChannels': {
            msg: "해당 구간의 통신 프로토콜을 암호화된 프로토콜(HTTPS, SSH, VPN 등)로 변경하십시오.",
            type: 'Connection'
        },
        'FindAuthIntegrityGaps': {
            msg: "해당 시스템에 다중 인증(MFA)을 적용하고 자산 대장에 등록하십시오.",
            type: 'System'
        },
        'FindContentControlFailures': {
            msg: "망 간 이동 시 문서 파일은 CDR, 중요 정보는 DLP 솔루션을 적용하십시오.",
            type: 'ConnectionData'
        },
        'FindUnencryptedStorage': {
            msg: "중요 데이터 저장 시 DB 암호화 또는 디스크 암호화(BitLocker 등)를 적용하십시오.",
            type: 'SystemData'
        },
        'FindAdminAccessViolation': {
            msg: "관리자 인터페이스는 오직 관리자 전용 단말(Management Device)에서만 접근해야 합니다.",
            type: 'Connection'
        }
    };

    // Regex to find fields in AnalysisResult
    const fieldRegex = /<field label="([^"]+)"[^>]*>([\s\S]*?)<\/field>/g;
    let fieldMatch;

    // Debug: Save XML to file
    try {
        fs.writeFileSync('debug_last_run.xml', xml);
        console.log('Saved XML to debug_last_run.xml');
    } catch (err) {
        console.error('Failed to save debug XML:', err);
    }

    // Debug: Log XML content length and first 500 chars
    console.log(`XML Content Length: ${xml.length}`);
    console.log(`XML Preview: ${xml.substring(0, 500)}`);

    while ((fieldMatch = fieldRegex.exec(xml)) !== null) {
        const fieldName = fieldMatch[1];
        const content = fieldMatch[2];
        console.log(`Found field: ${fieldName}`);

        if (threatConfig[fieldName]) {
            const config = threatConfig[fieldName];
            const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
            let tupleMatch;

            while ((tupleMatch = tupleRegex.exec(content)) !== null) {
                const tupleContent = tupleMatch[1];
                // Allow optional whitespace before />
                const atomRegex = /<atom label="([^"]+)"\s*\/>/g;
                const atoms = [];
                let am;
                while ((am = atomRegex.exec(tupleContent)) !== null) {
                    atoms.push(cleanLabel(am[1]));
                }

                console.log(`Parsed atoms for ${fieldName}:`, atoms);

                // atoms[0] is usually AnalysisResult$0
                // Data starts from atoms[1]
                if (!atoms || atoms.length < 2) continue;

                if (config.type === 'System') {
                    threats[fieldName].push({
                        system: atoms[1],
                        remediation: config.msg
                    });
                    total_count++;
                } else if (config.type === 'Connection') {
                    threats[fieldName].push({
                        connection: atoms[1],
                        remediation: config.msg
                    });
                    total_count++;
                } else if (config.type === 'SystemData') {
                    threats[fieldName].push({
                        system: atoms[1],
                        data: atoms[2],
                        remediation: config.msg
                    });
                    total_count++;
                } else if (config.type === 'ConnectionData') {
                    threats[fieldName].push({
                        connection: atoms[1],
                        data: atoms[2],
                        remediation: config.msg
                    });
                    total_count++;
                }
            }
        }
    }

    console.log('Parsed Threats:', JSON.stringify(threats, null, 2));
    return { threats, total_count };
}

module.exports = { executeAlloy };
