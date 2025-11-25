const { exec } = require('child_process');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        const alloyJarPath = path.join(__dirname, '../alloy/alloy4.2_2015-02-22.jar');
        const runnerPath = path.join(__dirname, 'AlloyRunner.java');
        const classpath = `.;${alloyJarPath}`; // Windows classpath separator

        // Compile first (optional if pre-compiled, but good for dev)
        // Note: In production, we should compile once. For now, compile on fly or assume compiled.
        // Let's assume we compile it once or run with java directly if single file (Java 11+)
        // But for safety with dependencies, let's compile.

        const srcDir = __dirname;
        const compileCmd = `javac -cp "${alloyJarPath}" "${runnerPath}"`;

        exec(compileCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Compilation error: ${error}`);
                return reject(error);
            }

            // Run
            const runCmd = `java -cp "${srcDir};${alloyJarPath}" AlloyRunner "${filePath}"`;
            exec(runCmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Execution error: ${error}`);
                    return reject(error);
                }
                resolve(stdout);
            });
        });
    });
}

module.exports = { executeAlloy };
