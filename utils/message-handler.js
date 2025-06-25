const axios = require('axios');

async function handleMessage(message, agent, client) {
  try {
    // Log incoming message
    console.log(`📨 ${agent.name} received: ${message.content}`);
    
    // Show typing indicator
    await message.channel.sendTyping();
    
    // Send to n8n for AI processing
    const n8nResponse = await sendToN8N(message, agent);
    
    // Send response back to Discord
    if (n8nResponse && n8nResponse.reply) {
      await message.reply({
        content: n8nResponse.reply,
        allowedMentions: { repliedUser: false }
      });
    }
    
  } catch (error) {
    console.error(`Error handling message for ${agent.name}:`, error);
    await message.react('❌');
  }
}

async function sendToN8N(message, agent) {
  try {
    const payload = {
      content: message.content,
      author: message.author.username,
      authorId: message.author.id,
      channel: message.channel.name,
      channelId: message.channel.id,
      messageId: message.id,
      timestamp: message.createdTimestamp,
      agent: agent.name,
      mentions: message.mentions.users.map(u => u.username)
    };
    
    const response = await axios.post(agent.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 second timeout
    });
    
    return response.data;
    
  } catch (error) {
    console.error(`Failed to send to n8n:`, error.message);
    return null;
  }
}

module.exports = { handleMessage };