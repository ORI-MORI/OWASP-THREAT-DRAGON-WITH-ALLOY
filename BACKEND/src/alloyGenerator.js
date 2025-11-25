const fs = require('fs');
const path = require('path');

async function generateAlloyFile(diagramData) {
    const templatePath = path.join(__dirname, '../alloy/Org_Instance_Template.als');
    const outputPath = path.join(__dirname, '../alloy/Org_Instance.als');

    let template = fs.readFileSync(templatePath, 'utf8');

    let assets = '';
    let data = '';
    let flows = '';
    let facts = '';

    const nodes = [];
    const edges = [];

    if (diagramData.cells) {
        diagramData.cells.forEach(cell => {
            if (cell.shape === 'process' || cell.shape === 'store' || cell.shape === 'actor') {
                nodes.push(cell);
            } else if (cell.shape === 'flow') {
                edges.push(cell);
            }
        });
    }

    // Generate Assets
    nodes.forEach(node => {
        const name = cleanName(node.attrs && node.attrs.text && node.attrs.text.text ? node.attrs.text.text : (node.label || node.id));
        assets += `one sig ${name} extends Asset {}\n`;

        // Default properties for now
        facts += `    ${name}.level = Open\n`;
        facts += `    ${name}.zone = Internal\n`;
        facts += `    ${name}.status = Secure\n`;
        facts += `    ${name}.is_registered = True\n`;
        facts += `    ${name}.has_agent = True\n`;
    });

    // Generate Flows and Data
    edges.forEach((edge, index) => {
        const sourceId = edge.source.cell;
        const targetId = edge.target.cell;
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);

        if (sourceNode && targetNode) {
            const sourceName = cleanName(sourceNode.attrs && sourceNode.attrs.text && sourceNode.attrs.text.text ? sourceNode.attrs.text.text : (sourceNode.label || sourceNode.id));
            const targetName = cleanName(targetNode.attrs && targetNode.attrs.text && targetNode.attrs.text.text ? targetNode.attrs.text.text : (targetNode.label || targetNode.id));
            const flowName = `Flow_${index}`;
            const dataName = `Data_${index}`;

            // Data
            data += `one sig ${dataName} extends Data {}\n`;
            facts += `    ${dataName}.classification = Open\n`;
            facts += `    ${dataName}.content = Clean\n`;
            facts += `    ${dataName}.is_sanitized = True\n`;

            // Flow
            flows += `one sig ${flowName} extends Flow {}\n`;
            facts += `    ${flowName}.from = ${sourceName}\n`;
            facts += `    ${flowName}.to = ${targetName}\n`;
            facts += `    ${flowName}.data = ${dataName}\n`;
            facts += `    ${flowName}.via = none\n`; // Default no relay
            facts += `    ${flowName}.is_encrypted = False\n`;
        }
    });

    // Wrap facts
    const factBlock = `\nfact Instance_Properties {\n${facts}}\n`;

    // Replace placeholders
    let content = template.replace('// ASSETS_HERE', assets)
        .replace('// DATA_HERE', data)
        .replace('// FLOWS_HERE', flows + factBlock);

    fs.writeFileSync(outputPath, content);
    return outputPath;
}

function cleanName(name) {
    if (!name) return 'Unknown';
    // Ensure it starts with a letter and contains only alphanumeric
    let cleaned = name.replace(/[^a-zA-Z0-9]/g, '_');
    if (!/^[a-zA-Z]/.test(cleaned)) {
        cleaned = 'N' + cleaned;
    }
    return cleaned;
}

module.exports = { generateAlloyFile };
