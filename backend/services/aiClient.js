const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// POST the uploaded image bytes to the Python AI service (works across containers).
async function analyzeImage(imagePath, kind) {
  const url = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    const res = await axios.post(`${url}/analyze/${kind}`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
      maxBodyLength: 20 * 1024 * 1024,
    });
    return res.data;
  } catch (err) {
    // Graceful fallback: clearly-labelled result if the AI service is down
    return {
      demo: true, fallback: true, crop: 'Unknown', disease: 'Unknown - Analysis Unavailable',
      confidence: 0, severity: 'Unknown', risk: 'MEDIUM',
      symptoms: [], recommendations: ['Start the AI service (ai-service/main.py) to get real analysis.'],
      prevention: [], note: 'AI service unreachable.',
    };
  }
}
module.exports = { analyzeImage };
