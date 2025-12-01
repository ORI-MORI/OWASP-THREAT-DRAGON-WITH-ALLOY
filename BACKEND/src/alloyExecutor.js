const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        // Paths
        // Correct JAR path: BACKEND/alloy/alloy4.2_2015-02-22.jar
        const jarPath = path.join(__dirname, '../alloy/alloy4.2_2015-02-22.jar');
        const classpath = `.;${jarPath}`;
        const runnerPath = path.join(__dirname, 'AlloyRunner.java');
        const cwd = path.resolve(__dirname, '../');

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
            const runCmd = `java -cp "src;${classpath}" AlloyRunner "${filePath}"`;

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

    const fields = [
        { name: 'FindStorageViolations', key: 'StorageViolations', type: 'System->Data' },
        { name: 'FindFlowViolations', key: 'FlowViolations', type: 'Connection->Data' },
        { name: 'FindLocationViolations', key: 'LocationViolations', type: 'System' },
        { name: 'FindBypassViolations', key: 'BypassViolations', type: 'Connection' },
        { name: 'FindUnencryptedChannels', key: 'UnencryptedChannels', type: 'Connection' },
        { name: 'FindAuthIntegrityGaps', key: 'AuthIntegrityGaps', type: 'System' },
        { name: 'FindContentControlFailures', key: 'ContentControlFailures', type: 'Connection->Data' }
    ];

    fields.forEach(field => {
        threats[field.key] = [];

        // Find the field block
        const fieldRegex = new RegExp(`<field[^>]*label="${field.name}"[^>]*>([\\s\\S]*?)</field>`, 'g');
        const match = fieldRegex.exec(xml);

        if (match) {
            const content = match[1];
            // Find all tuples
            const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
            let tupleMatch;
            while ((tupleMatch = tupleRegex.exec(content)) !== null) {
                const tupleContent = tupleMatch[1];
                // Extract atoms
                const atomRegex = /<atom[^>]*label="([^"]+)"/g;
                const atoms = [];
                let atomMatch;
                while ((atomMatch = atomRegex.exec(tupleContent)) !== null) {
                    // Clean label: remove path prefix and $0 suffix
                    // e.g. "n2sf_rules/n2sf_base/System99$0" -> "System99"
                    // e.g. "AnalysisResult$0" -> "AnalysisResult"
                    let label = atomMatch[1];
                    label = label.split('/').pop(); // Remove prefix
                    label = label.split('$')[0];    // Remove suffix
                    atoms.push(label);
                }

                // First atom is always AnalysisResult, ignore it
                if (atoms.length > 0 && atoms[0] === 'AnalysisResult') {
                    atoms.shift();
                }

                const violation = {};
                if (field.type === 'System->Data') {
                    violation.system = atoms[0];
                    violation.data = atoms[1];
                } else if (field.type === 'Connection->Data') {
                    violation.connection = atoms[0];
                    violation.data = atoms[1];
                } else if (field.type === 'System') {
                    violation.system = atoms[0];
                } else if (field.type === 'Connection') {
                    violation.connection = atoms[0];
                }

                threats[field.key].push(violation);
                total_count++;
            }
        }
    });

    return { threats, total_count };
}

module.exports = { executeAlloy };
