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

        if (executionResult.success) {
            res.json({ success: true, result: executionResult.result });
        } else {
            res.status(500).json({ success: false, error: executionResult.error });
        }
    } catch (error) {
        console.error('Error during analysis:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
