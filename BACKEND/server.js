const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/analyze', async (req, res) => {
    try {
        const diagramData = req.body;
        console.log('Received diagram data:', JSON.stringify(diagramData, null, 2));

        // 1. Generate Alloy file
        const alloyFilePath = await generateAlloyFile(diagramData);
        console.log('Generated Alloy file at:', alloyFilePath);

        // 2. Execute Alloy
        const executionResult = await executeAlloy(alloyFilePath);
        console.log('Alloy execution result:', executionResult);

        // 3. Cleanup
        try {
            // if (fs.existsSync(alloyFilePath)) fs.unlinkSync(alloyFilePath);
            // const xmlPath = alloyFilePath.replace('.als', '.xml');
            // if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);
            console.log('Cleaned up generated files (SKIPPED for debugging).');
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }

        if (executionResult.success) {
            res.json({ success: true, result: executionResult.result });
        } else {
            res.status(500).json({ success: false, error: executionResult.error });
        }
    } catch (error) {
        console.error('Error during analysis:', error);
        fs.writeFileSync('last_error.txt', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        res.status(500).json({ success: false, error: error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    console.error('Server failed to start:', error);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});
