// index.js - Main bot file with n8n API integration
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const cors = require('cors');
const { handleMessage } = require('./utils/message-handler');

// Express for Railway health checks AND n8n API
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    bots: Object.keys(agents).map(a => ({ 
      name: agents[a].name, 
      status: agents[a].client ? 'online' : 'offline' 
    }))
  });
});

// Agent configurations
const agents = {
  olivia: {
    name: 'OLIVIA-COO',
    token: process.env.OLIVIA_TOKEN,
    status: '📊 Orchestrating Operations',
    color: 0x4169E1,
    channel: 'coo-chief-operations',
    webhookUrl: process.env.N8N_COO_WEBHOOK
  },
  brandon: {
    name: 'BRANDON-CBO',
    token: process.env.BRANDON_TOKEN,
    status: '🎨 Creating Brand Excellence',
    color: 0x9B59B6,
    channel: 'cbo-chief-brand',
    webhookUrl: process.env.N8N_CBO_WEBHOOK
  },
  maya: {
    name: 'MAYA-CMO',
    token: process.env.MAYA_TOKEN,
    status: '📈 Amplifying Brand Reach',
    color: 0xE91E63,
    channel: 'cmo-chief-marketing',
    webhookUrl: process.env.N8N_CMO_WEBHOOK
  },
  ethan: {
    name: 'ETHAN-CECO',
    token: process.env.ETHAN_TOKEN,
    status: '🛒 Optimizing Conversions',
    color: 0x27AE60,
    channel: 'ceco-chief-ecommerce',
    webhookUrl: process.env.N8N_CECO_WEBHOOK
  },
  tyler: {
    name: 'TYLER-CTO',
    token: process.env.TYLER_TOKEN,
    status: '⚡ Building Tech Solutions',
    color: 0xFF6B35,
    channel: 'cto-chief-technology',
    webhookUrl: process.env.N8N_CTO_WEBHOOK
  },
  diana: {
    name: 'DIANA-CDO',
    token: process.env.DIANA_TOKEN,
    status: '📊 Analyzing Data Insights',
    color: 0x00BCD4,
    channel: 'cdo-chief-data',
    webhookUrl: process.env.N8N_CDO_WEBHOOK
  },
  xavier: {
    name: 'XAVIER-CXO',
    token: process.env.XAVIER_TOKEN,
    status: '✨ Crafting Experiences',
    color: 0xFFC107,
    channel: 'cxo-chief-experience',
    webhookUrl: process.env.N8N_CXO_WEBHOOK
  },
  parker: {
    name: 'PARKER-CPO',
    token: process.env.PARKER_TOKEN,
    status: '📦 Innovating Products',
    color: 0x795548,
    channel: 'cpo-chief-product',
    webhookUrl: process.env.N8N_CPO_WEBHOOK
  }
};

// =====================================
// NEW: n8n API Endpoints
// =====================================

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bots: {}
  };
  
  // Check each bot's status
  Object.entries(agents).forEach(([key, agent]) => {
    healthStatus.bots[key] = {
      name: agent.name,
      connected: agent.client && agent.client.isReady(),
      channel: agent.channel
    };
  });
  
  res.json(healthStatus);
});

// Main endpoint for n8n to send messages through specific bots
app.post('/api/:botKey/send-message', async (req, res) => {
  try {
    const { botKey } = req.params;
    const { channelId, messageId, response, action = 'reply' } = req.body;
    
    console.log(`[${botKey}] Received n8n request:`, { channelId, messageId, action });
    
    // Validate bot exists
    const agent = agents[botKey];
    if (!agent) {
      return res.status(404).json({ 
        error: 'Bot not found',
        availableBots: Object.keys(agents)
      });
    }
    
    // Check if bot is connected
    if (!agent.client || !agent.client.isReady()) {
      return res.status(503).json({ 
        error: `${agent.name} is not connected to Discord`
      });
    }
    
    // Get the channel
    const channel = await agent.client.channels.fetch(channelId);
    if (!channel) {
      return res.status(404).json({ 
        error: 'Channel not found',
        channelId 
      });
    }
    
    let result;
    
    if (action === 'reply' && messageId) {
      // Reply to specific message
      const originalMessage = await channel.messages.fetch(messageId);
      result = await originalMessage.reply(response);
      console.log(`[${agent.name}] Replied to message ${messageId}`);
    } else {
      // Send new message
      result = await channel.send(response);
      console.log(`[${agent.name}] Sent new message to ${channel.name}`);
    }
    
    res.json({ 
      success: true,
      messageId: result.id,
      channelName: channel.name,
      bot: agent.name,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generic endpoint that accepts bot name in body (backwards compatibility)
app.post('/api/send-message', async (req, res) => {
  const { bot, botKey, ...messageData } = req.body;
  const key = botKey || bot || 'olivia'; // Default to OLIVIA if not specified
  
  // Forward to specific bot endpoint
  req.body = messageData;
  req.params = { botKey: key };
  return app._router.handle(req, res);
});

// List all available bots
app.get('/api/bots', (req, res) => {
  const botList = Object.entries(agents).map(([key, agent]) => ({
    key,
    name: agent.name,
    channel: agent.channel,
    status: agent.client && agent.client.isReady() ? 'online' : 'offline',
    color: agent.color
  }));
  
  res.json({ bots: botList });
});

// =====================================
// Initialize all bots
// =====================================
async function initializeBots() {
  for (const [key, agent] of Object.entries(agents)) {
    try {
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.DirectMessages
        ]
      });

      client.once('ready', () => {
        console.log(`✅ ${agent.name} is online!`);
        
        // Set custom status
        client.user.setActivity(agent.status, {
          type: ActivityType.Custom
        });
      });

      // Message handler - UPDATED FOR ALL AGENTS
      client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        // Create flexible patterns for agent name matching
        const fullNamePattern = new RegExp(agent.name.replace('-', '[-\\s]?'), 'i');
        const shortNamePattern = new RegExp(`\\b${key}\\b`, 'i'); // Matches just the first name
        const mentionPattern = message.mentions.has(client.user);
        
        // Check if message is relevant to this agent
        if (
          message.channel.name === agent.channel || // In agent's channel
          fullNamePattern.test(message.content) ||  // Full name mentioned
          shortNamePattern.test(message.content) || // Short name mentioned (NEW!)
          mentionPattern // Bot is @mentioned
        ) {
          console.log(`${agent.name} triggered by: "${message.content}"`);
          await handleMessage(message, agent, client);
        }
      });

      // Store client reference
      agent.client = client;
      
      // Login
      await client.login(agent.token);
      
    } catch (error) {
      console.error(`❌ Failed to initialize ${agent.name}:`, error.message);
    }
  }
}

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Railway health check server running on port ${PORT}`);
  console.log(`📡 n8n API endpoints available at:`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/bots`);
  console.log(`   - POST /api/:botKey/send-message`);
  console.log(`   - POST /api/send-message`);
  console.log(`\n✨ All agents now respond to short names!`);
  console.log(`   Examples: "olivia", "brandon", "maya", etc.`);
  initializeBots();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  Object.values(agents).forEach(agent => {
    if (agent.client) agent.client.destroy();
  });
  process.exit(0);
});