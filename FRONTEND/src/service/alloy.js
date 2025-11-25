import axios from 'axios';

const API_URL = 'http://localhost:3000';

export default {
    async analyze(diagramData) {
        try {
            const response = await axios.post(`${API_URL}/analyze`, diagramData);
            return response.data;
        } catch (error) {
            console.error('Alloy analysis failed:', error);
            throw error;
        }
    }
};
