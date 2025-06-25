const axios = require('axios');

class N8NConnector {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendData(data) {
    try {
      const response = await axios.post(this.webhookUrl, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error('N8N connection error:', error);
      throw error;
    }
  }
}

module.exports = N8NConnector;