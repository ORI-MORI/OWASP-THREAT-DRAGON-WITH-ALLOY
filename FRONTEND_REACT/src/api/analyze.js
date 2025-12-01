export async function analyzeGraph(payload) {
    try {
        const response = await fetch('http://localhost:3001/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Analysis failed:', error);
        return { success: false, error: error.message };
    }
}
