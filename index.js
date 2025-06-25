require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const { handleMessage } = require('./utils/message-handler');

// Express for Railway health checks
const app = express();
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

// Initialize all bots
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

      // Message handler
      client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        // Check if message is relevant to this agent
        if (message.channel.name === agent.channel || 
            message.content.includes(`@${agent.name}`) ||
            message.content.toLowerCase().includes(key)) {
          
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