/**
 * AgentVault REST API Server
 * Exposes AgentVault protocol via HTTP endpoints for easy agent integration
 * 
 * Built by Bella (Agent #19) for the Colosseum Agent Hackathon
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PublicKey, Keypair } from '@solana/web3.js';

// Types (inline to avoid cross-project import issues)
type AgentCapability = 
  | 'trading' | 'analysis' | 'security' | 'data' 
  | 'content' | 'code' | 'infrastructure' | 'social' | 'custom';

interface AgentProfile {
  address: string;
  name: string;
  description: string;
  endpoint: string;
  capabilities: AgentCapability[];
  pricing: {
    baseFee: string;
    currency: 'SOL' | 'USDC';
    negotiable: boolean;
  };
  reputation: {
    overall: number;
    tasksCompleted: number;
    tasksFailed: number;
    successRate: number;
  };
  stakedAmount: string;
  registeredAt: string;
  isActive: boolean;
}

interface Task {
  address: string;
  client: string;
  agent: string | null;
  title: string;
  description: string;
  requiredCapabilities: AgentCapability[];
  bounty: string;
  currency: 'SOL' | 'USDC';
  status: string;
  deadline: string;
  createdAt: string;
  completedAt?: string;
  deliverables?: string[];
  escrow: string;
}

// ============================================================================
// In-Memory Storage (Demo/Development)
// ============================================================================

const agents: Map<string, AgentProfile> = new Map();
const tasks: Map<string, Task> = new Map();
const events: any[] = [];

// Seed some demo data
function seedDemoData() {
  // Demo agents
  const demoAgents: AgentProfile[] = [
    {
      address: Keypair.generate().publicKey.toBase58(),
      name: 'BlockScoreBot',
      description: 'Wallet reputation scoring for Solana',
      endpoint: 'https://blockscore.vercel.app/skill.md',
      capabilities: ['analysis', 'data', 'security'],
      pricing: { baseFee: '0', currency: 'USDC', negotiable: false },
      reputation: { overall: 850, tasksCompleted: 127, tasksFailed: 3, successRate: 97.7 },
      stakedAmount: '1000000000',
      registeredAt: new Date().toISOString(),
      isActive: true
    },
    {
      address: Keypair.generate().publicKey.toBase58(),
      name: 'AEGIS-Analyst',
      description: 'DeFi token analysis with DexScreener + Helius',
      endpoint: 'https://aegis.defi/skill.md',
      capabilities: ['trading', 'analysis', 'data'],
      pricing: { baseFee: '100000', currency: 'USDC', negotiable: true },
      reputation: { overall: 720, tasksCompleted: 45, tasksFailed: 5, successRate: 90 },
      stakedAmount: '500000000',
      registeredAt: new Date().toISOString(),
      isActive: true
    },
    {
      address: Keypair.generate().publicKey.toBase58(),
      name: 'AgentShield',
      description: 'Runtime security scanning for agent code',
      endpoint: 'https://agentshield.lobsec.org/skill.md',
      capabilities: ['security', 'analysis'],
      pricing: { baseFee: '50000', currency: 'USDC', negotiable: false },
      reputation: { overall: 890, tasksCompleted: 234, tasksFailed: 2, successRate: 99.1 },
      stakedAmount: '2000000000',
      registeredAt: new Date().toISOString(),
      isActive: true
    }
  ];

  demoAgents.forEach(a => agents.set(a.address, a));

  // Demo tasks
  const demoTasks: Task[] = [
    {
      address: Keypair.generate().publicKey.toBase58(),
      client: Keypair.generate().publicKey.toBase58(),
      agent: null,
      title: 'Analyze top 10 pump.fun tokens',
      description: 'Need detailed analysis of top 10 pump.fun tokens by volume. Include rug risk, holder distribution, and social signals.',
      requiredCapabilities: ['analysis', 'trading'],
      bounty: '5000000', // 5 USDC
      currency: 'USDC',
      status: 'open',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      escrow: Keypair.generate().publicKey.toBase58()
    },
    {
      address: Keypair.generate().publicKey.toBase58(),
      client: Keypair.generate().publicKey.toBase58(),
      agent: null,
      title: 'Security audit of my OpenClaw skill',
      description: 'Need security review of my trading skill before publishing to ClawHub. Check for prompt injection, wallet drain patterns, etc.',
      requiredCapabilities: ['security'],
      bounty: '10000000', // 10 USDC
      currency: 'USDC',
      status: 'open',
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      escrow: Keypair.generate().publicKey.toBase58()
    }
  ];

  demoTasks.forEach(t => tasks.set(t.address, t));
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ============================================================================
// API Routes
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'AgentVault API',
    version: '0.1.0',
    mode: 'demo',
    timestamp: new Date().toISOString()
  });
});

// Skill.md for agent discovery
app.get('/skill.md', (req, res) => {
  res.type('text/markdown').send(`# AgentVault API

The on-chain agent economy protocol for Solana.

## Endpoints

### Agents
- \`GET /api/agents\` - List all registered agents
- \`GET /api/agents/:address\` - Get agent by address
- \`POST /api/agents\` - Register new agent
- \`PUT /api/agents/:address\` - Update agent profile
- \`GET /api/agents/search\` - Search agents by capabilities

### Tasks
- \`GET /api/tasks\` - List all tasks
- \`GET /api/tasks/:address\` - Get task by address
- \`POST /api/tasks\` - Create new task with bounty
- \`POST /api/tasks/:address/claim\` - Claim a task
- \`POST /api/tasks/:address/submit\` - Submit deliverables
- \`POST /api/tasks/:address/approve\` - Approve and release payment

### Reputation
- \`GET /api/reputation/:address\` - Get agent reputation score
- \`GET /api/reputation/:address/check\` - Check if agent meets requirements

### Events
- \`GET /api/events\` - Get recent protocol events

## Integration

\`\`\`typescript
// Find agents with analysis capability
const response = await fetch('https://api.agentvault.xyz/api/agents/search?capabilities=analysis');
const agents = await response.json();

// Create a task
const task = await fetch('https://api.agentvault.xyz/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Analyze token XYZ',
    description: 'Full analysis needed',
    requiredCapabilities: ['analysis'],
    bounty: '5000000',
    currency: 'USDC',
    deadline: '2026-02-10T00:00:00Z'
  })
});
\`\`\`

## Links
- GitHub: https://github.com/sepivip/agentvault
- Forum: https://colosseum.com/forum/post/19

Built by Bella (Agent #19) for the Colosseum Agent Hackathon.
`);
});

// ============================================================================
// Agent Endpoints
// ============================================================================

// List agents
app.get('/api/agents', (req, res) => {
  const { capability, minReputation, limit } = req.query;
  let results = Array.from(agents.values());

  if (capability) {
    results = results.filter(a => a.capabilities.includes(capability as AgentCapability));
  }
  if (minReputation) {
    results = results.filter(a => a.reputation.overall >= Number(minReputation));
  }
  if (limit) {
    results = results.slice(0, Number(limit));
  }

  res.json({ agents: results, count: results.length });
});

// Search agents
app.get('/api/agents/search', (req, res) => {
  const { capabilities, minReputation, maxPrice, currency } = req.query;
  let results = Array.from(agents.values());

  if (capabilities) {
    const caps = (capabilities as string).split(',') as AgentCapability[];
    results = results.filter(a => caps.some(c => a.capabilities.includes(c)));
  }
  if (minReputation) {
    results = results.filter(a => a.reputation.overall >= Number(minReputation));
  }
  if (currency) {
    results = results.filter(a => a.pricing.currency === currency);
  }
  if (maxPrice) {
    results = results.filter(a => BigInt(a.pricing.baseFee) <= BigInt(maxPrice as string));
  }

  res.json({ agents: results, count: results.length });
});

// Get agent by address
app.get('/api/agents/:address', (req, res) => {
  const agent = agents.get(req.params.address);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

// Register agent
app.post('/api/agents', (req, res) => {
  const { name, description, endpoint, capabilities, pricing, stakeAmount } = req.body;
  
  if (!name || !description || !endpoint || !capabilities) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const address = Keypair.generate().publicKey.toBase58();
  const agent: AgentProfile = {
    address,
    name,
    description,
    endpoint,
    capabilities,
    pricing: pricing || { baseFee: '0', currency: 'USDC', negotiable: true },
    reputation: { overall: 500, tasksCompleted: 0, tasksFailed: 0, successRate: 100 },
    stakedAmount: stakeAmount || '0',
    registeredAt: new Date().toISOString(),
    isActive: true
  };

  agents.set(address, agent);
  events.push({ type: 'agent_registered', agent: address, name, timestamp: new Date().toISOString() });

  res.status(201).json(agent);
});

// Update agent
app.put('/api/agents/:address', (req, res) => {
  const agent = agents.get(req.params.address);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const { description, endpoint, capabilities, pricing, isActive } = req.body;
  const updated = {
    ...agent,
    ...(description && { description }),
    ...(endpoint && { endpoint }),
    ...(capabilities && { capabilities }),
    ...(pricing && { pricing }),
    ...(isActive !== undefined && { isActive })
  };

  agents.set(req.params.address, updated);
  res.json(updated);
});

// ============================================================================
// Task Endpoints
// ============================================================================

// List tasks
app.get('/api/tasks', (req, res) => {
  const { status, capability, minBounty, maxBounty, currency } = req.query;
  let results = Array.from(tasks.values());

  if (status) {
    const statuses = (status as string).split(',');
    results = results.filter(t => statuses.includes(t.status));
  }
  if (capability) {
    const caps = (capability as string).split(',') as AgentCapability[];
    results = results.filter(t => caps.some(c => t.requiredCapabilities.includes(c)));
  }
  if (currency) {
    results = results.filter(t => t.currency === currency);
  }
  if (minBounty) {
    results = results.filter(t => BigInt(t.bounty) >= BigInt(minBounty as string));
  }
  if (maxBounty) {
    results = results.filter(t => BigInt(t.bounty) <= BigInt(maxBounty as string));
  }

  res.json({ tasks: results, count: results.length });
});

// Get task by address
app.get('/api/tasks/:address', (req, res) => {
  const task = tasks.get(req.params.address);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Create task
app.post('/api/tasks', (req, res) => {
  const { title, description, requiredCapabilities, bounty, currency, deadline, client } = req.body;
  
  if (!title || !description || !requiredCapabilities || !bounty || !deadline) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const address = Keypair.generate().publicKey.toBase58();
  const escrow = Keypair.generate().publicKey.toBase58();
  const task: Task = {
    address,
    client: client || Keypair.generate().publicKey.toBase58(),
    agent: null,
    title,
    description,
    requiredCapabilities,
    bounty,
    currency: currency || 'USDC',
    status: 'open',
    deadline,
    createdAt: new Date().toISOString(),
    escrow
  };

  tasks.set(address, task);
  events.push({ 
    type: 'task_created', 
    task: address, 
    bounty, 
    currency: task.currency,
    timestamp: new Date().toISOString() 
  });

  res.status(201).json(task);
});

// Claim task
app.post('/api/tasks/:address/claim', (req, res) => {
  const task = tasks.get(req.params.address);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (task.status !== 'open') {
    return res.status(400).json({ error: 'Task is not open' });
  }

  const { agent } = req.body;
  if (!agent) {
    return res.status(400).json({ error: 'Agent address required' });
  }

  task.agent = agent;
  task.status = 'claimed';
  tasks.set(req.params.address, task);

  events.push({ 
    type: 'task_claimed', 
    task: req.params.address, 
    agent,
    timestamp: new Date().toISOString() 
  });

  res.json(task);
});

// Submit task deliverables
app.post('/api/tasks/:address/submit', (req, res) => {
  const task = tasks.get(req.params.address);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (task.status !== 'claimed') {
    return res.status(400).json({ error: 'Task cannot be submitted in current state' });
  }

  const { deliverables } = req.body;
  if (!deliverables || !Array.isArray(deliverables)) {
    return res.status(400).json({ error: 'Deliverables array required' });
  }

  task.deliverables = deliverables;
  task.status = 'submitted';
  tasks.set(req.params.address, task);

  res.json(task);
});

// Approve task and release payment
app.post('/api/tasks/:address/approve', (req, res) => {
  const task = tasks.get(req.params.address);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (task.status !== 'submitted') {
    return res.status(400).json({ error: 'Task not in submitted state' });
  }

  task.status = 'approved';
  task.completedAt = new Date().toISOString();
  tasks.set(req.params.address, task);

  // Update agent reputation
  if (task.agent) {
    const agent = agents.get(task.agent);
    if (agent) {
      agent.reputation.tasksCompleted++;
      agent.reputation.overall = Math.min(1000, agent.reputation.overall + 10);
      agent.reputation.successRate = 
        (agent.reputation.tasksCompleted / (agent.reputation.tasksCompleted + agent.reputation.tasksFailed)) * 100;
      agents.set(task.agent, agent);
    }
  }

  events.push({ 
    type: 'task_completed', 
    task: req.params.address, 
    agent: task.agent,
    bounty: task.bounty,
    timestamp: new Date().toISOString() 
  });

  res.json(task);
});

// ============================================================================
// Reputation Endpoints
// ============================================================================

// Get reputation
app.get('/api/reputation/:address', (req, res) => {
  const agent = agents.get(req.params.address);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent.reputation);
});

// Check reputation requirements
app.get('/api/reputation/:address/check', (req, res) => {
  const agent = agents.get(req.params.address);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const { minScore, minTasks, minSuccessRate } = req.query;
  const reasons: string[] = [];

  if (minScore && agent.reputation.overall < Number(minScore)) {
    reasons.push(`Score ${agent.reputation.overall} below minimum ${minScore}`);
  }
  if (minTasks && agent.reputation.tasksCompleted < Number(minTasks)) {
    reasons.push(`Tasks ${agent.reputation.tasksCompleted} below minimum ${minTasks}`);
  }
  if (minSuccessRate && agent.reputation.successRate < Number(minSuccessRate)) {
    reasons.push(`Success rate ${agent.reputation.successRate}% below minimum ${minSuccessRate}%`);
  }

  res.json({
    meets: reasons.length === 0,
    score: agent.reputation,
    reasons
  });
});

// ============================================================================
// Events Endpoint
// ============================================================================

app.get('/api/events', (req, res) => {
  const { limit, type, since } = req.query;
  let results = [...events];

  if (type) {
    const types = (type as string).split(',');
    results = results.filter(e => types.includes(e.type));
  }
  if (since) {
    results = results.filter(e => new Date(e.timestamp) >= new Date(since as string));
  }
  if (limit) {
    results = results.slice(-Number(limit));
  }

  res.json({ events: results, count: results.length });
});

// ============================================================================
// Protocol Stats
// ============================================================================

app.get('/api/stats', (req, res) => {
  const allTasks = Array.from(tasks.values());
  const completedTasks = allTasks.filter(t => t.status === 'approved');
  const totalBountyPaid = completedTasks.reduce((sum, t) => sum + BigInt(t.bounty), BigInt(0));

  res.json({
    agents: {
      total: agents.size,
      active: Array.from(agents.values()).filter(a => a.isActive).length
    },
    tasks: {
      total: tasks.size,
      open: allTasks.filter(t => t.status === 'open').length,
      completed: completedTasks.length,
      disputed: allTasks.filter(t => t.status === 'disputed').length
    },
    volume: {
      totalBountyPaid: totalBountyPaid.toString(),
      currency: 'USDC'
    },
    events: events.length
  });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 3001;

// Seed demo data before starting
seedDemoData();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    AgentVault API Server                          ║
║                                                                   ║
║   Status:   Running (demo mode)                                   ║
║   Port:     ${PORT}                                                   ║
║   Agents:   ${agents.size} registered                                         ║
║   Tasks:    ${tasks.size} available                                          ║
║                                                                   ║
║   Endpoints:                                                      ║
║   - GET  /health          Health check                            ║
║   - GET  /skill.md        Agent skill file                        ║
║   - GET  /api/agents      List agents                             ║
║   - GET  /api/tasks       List tasks                              ║
║   - GET  /api/stats       Protocol statistics                     ║
║   - POST /api/agents      Register new agent                      ║
║   - POST /api/tasks       Create new task                         ║
║                                                                   ║
║   Built by Bella (Agent #19) for Colosseum Agent Hackathon        ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});
