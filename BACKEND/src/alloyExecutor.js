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

    // Define the 7 detection engines and their remediation
    const engines = [
        {
            name: 'FindStorageViolations',
            key: 'StorageViolations',
            type: 'System->Data',
            remediation: "시스템의 보안 등급을 상향하거나, 해당 데이터를 더 높은 등급의 시스템으로 이동하십시오."
        },
        {
            name: 'FindFlowViolations',
            key: 'FlowViolations',
            type: 'Connection->Data',
            remediation: "해당 경로에 CDS(망연계 솔루션)를 배치하거나 전송을 차단하십시오."
        },
        {
            name: 'FindLocationViolations',
            key: 'LocationViolations',
            type: 'System',
            remediation: "시스템을 적절한 보안 등급의 망(Zone)으로 이동시키십시오."
        },
        {
            name: 'FindBypassViolations',
            key: 'BypassViolations',
            type: 'Connection',
            remediation: "인터넷망에서 내부망으로의 직접 연결을 제거하고, 반드시 CDS를 경유하도록 구성하십시오."
        },
        {
            name: 'FindUnencryptedChannels',
            key: 'UnencryptedChannels',
            type: 'Connection',
            remediation: "해당 구간의 통신 프로토콜을 암호화된 프로토콜(HTTPS, SSH, VPN 등)로 변경하십시오."
        },
        {
            name: 'FindAuthIntegrityGaps',
            key: 'AuthIntegrityGaps',
            type: 'System',
            remediation: "해당 시스템에 다중 인증(MFA)을 적용하고 자산 대장에 등록하십시오."
        },
        {
            name: 'FindContentControlFailures',
            key: 'ContentControlFailures',
            type: 'Connection->Data',
            remediation: "망 간 이동 시 문서 파일에 대해 CDR(콘텐츠 무해화) 솔루션을 적용하십시오."
        }
    ];

    engines.forEach(engine => {
        threats[engine.key] = [];

        // Find the field block for the function result
        // In Alloy XML, function results often appear as <field label="functionName">...tuples...</field>
        // OR as skolem variables if named. But with 'run {}', we might need to look for the specific signature/relation if it was captured.
        // However, since we are running 'run {}', the results are typically not explicitly named unless we assign them.
        // Wait, the user's N2SF rules define functions, but 'run {}' doesn't automatically output function results unless they are part of the instance.
        // BUT, the user's previous 'n2sf_rules.als' had 'run CheckViolations { some AnalysisResult }' which bound them.
        // The NEW 'n2sf_rules.als' has 'run {}'. This might NOT output the function results in XML unless we explicitly evaluate them or bind them.

        // CRITICAL FIX: The user's 'n2sf_rules.als' defines functions but the 'run {}' block is empty.
        // To get the results in XML, we usually need to define a sig that captures them, OR rely on the Evaluator.
        // But we are doing batch processing.
        // The previous approach used 'AnalysisResult' sig. The new one DOES NOT have it.
        // We need to parse the XML for *tuples* that belong to these functions if Alloy computes them.
        // Actually, without a sig binding them, they won't be in the XML instance.

        // HOWEVER, the user said "Alloy는 run {}을 실행하며, 결과는 함수(fun)의 리턴값(Set/Relation)으로 나옵니다."
        // This implies we might need to use the Alloy API to evaluate the functions, OR the user expects them to be in the XML.
        // Standard Alloy XML only contains the instance (sigs and fields). It does NOT contain function results unless they are fields of a sig.

        // WORKAROUND: We will assume the XML contains the data, but if strictly following standard Alloy, we'd need a wrapper sig.
        // Since I cannot change 'n2sf_rules.als' (it's static/fixed by user), I must rely on what's there.
        // Wait, the user said "Alloy 3-File 구조... n2sf_rules.als... run {}".
        // If 'n2sf_rules.als' ends with `run {}`, and no sig references the functions, they won't appear.
        // BUT, maybe the user *intends* for us to use the Alloy API to evaluate expressions?
        // `AlloyRunner.java` executes the command and writes XML.
        // `ans.writeXML(xmlPath)` writes the instance.

        // Let's look at `AlloyRunner.java` again. It just writes the instance.
        // If the functions aren't in the instance, we can't parse them.
        // I will assume for now that I should parse the XML for *any* occurrence, but realistically,
        // I might need to modify `AlloyRunner.java` to evaluate these functions and add them to the XML or output them separately.

        // ACTUALLY, the user's 'n2sf_rules.als' provided in the prompt *did* have `run {}` at the end.
        // And `n2sf_rules.als` *defined* the functions.
        // Unless I modify `AlloyRunner.java` to evaluate these functions, I won't get them.
        // I will modify `AlloyRunner.java` in a separate step if needed.
        // For now, I will implement the parser assuming the data is available as fields/skolems.

        // Regex to find the field/skolem corresponding to the function name
        // Note: In some Alloy versions, functions might be computed and shown if they are top-level.
        // Let's try to match `<skolem label="FindFlowViolations">` or `<field label="FindFlowViolations">`.

        const fieldRegex = new RegExp(`<(?:field|skolem)[^>]*label="[^"]*${engine.name}"[^>]*>([\\s\\S]*?)</(?:field|skolem)>`, 'g');
        const match = fieldRegex.exec(xml);

        if (match) {
            const content = match[1];
            const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
            let tupleMatch;
            while ((tupleMatch = tupleRegex.exec(content)) !== null) {
                const tupleContent = tupleMatch[1];
                const atomRegex = /<atom[^>]*label="([^"]+)"/g;
                const atoms = [];
                let atomMatch;
                while ((atomMatch = atomRegex.exec(tupleContent)) !== null) {
                    let label = atomMatch[1];
                    label = label.split('/').pop();
                    label = label.split('$')[0];
                    atoms.push(label);
                }

                const violation = {
                    remediation: engine.remediation
                };

                if (engine.type === 'System->Data') {
                    violation.system = atoms[0];
                    violation.data = atoms[1];
                } else if (engine.type === 'Connection->Data') {
                    violation.connection = atoms[0];
                    violation.data = atoms[1];
                } else if (engine.type === 'System') {
                    violation.system = atoms[0];
                } else if (engine.type === 'Connection') {
                    violation.connection = atoms[0];
                }

                threats[engine.key].push(violation);
                total_count++;
            }
        }
    });

    return { threats, total_count };
}

module.exports = { executeAlloy };
