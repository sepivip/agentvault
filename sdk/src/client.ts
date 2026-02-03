/**
 * AgentVault Client
 * Main entry point for interacting with the AgentVault protocol
 */

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  AgentProfile,
  AgentCapability,
  PricingModel,
  ReputationScore,
  Task,
  TaskStatus,
  TaskFilter,
  Escrow,
  EscrowState,
  Dispute,
  AgentVaultEvent
} from './types';

// ============================================================================
// Configuration
// ============================================================================

export interface AgentVaultConfig {
  /** Solana RPC endpoint */
  rpcEndpoint: string;
  /** AgentVault program ID (when deployed) */
  programId?: PublicKey;
  /** Operating mode */
  mode: 'mock' | 'devnet' | 'mainnet';
  /** Wallet keypair for signing transactions */
  wallet?: Keypair;
  /** Optional commitment level */
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export const DEFAULT_CONFIG: Partial<AgentVaultConfig> = {
  rpcEndpoint: 'https://api.devnet.solana.com',
  mode: 'mock',
  commitment: 'confirmed'
};

// ============================================================================
// AgentVault Client
// ============================================================================

export class AgentVaultClient {
  private connection: Connection;
  private config: AgentVaultConfig;
  private wallet?: Keypair;
  
  // Mock storage (for development/testing)
  private mockAgents: Map<string, AgentProfile> = new Map();
  private mockTasks: Map<string, Task> = new Map();
  private mockEscrows: Map<string, Escrow> = new Map();
  private mockDisputes: Map<string, Dispute> = new Map();
  private mockEvents: AgentVaultEvent[] = [];

  constructor(config: Partial<AgentVaultConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as AgentVaultConfig;
    this.connection = new Connection(
      this.config.rpcEndpoint, 
      this.config.commitment
    );
    this.wallet = this.config.wallet;
  }

  // ==========================================================================
  // Agent Operations
  // ==========================================================================

  /**
   * Register a new agent on AgentVault
   */
  async registerAgent(params: {
    name: string;
    description: string;
    endpoint: string;
    capabilities: AgentCapability[];
    pricing: PricingModel;
    stakeAmount: bigint;
  }): Promise<AgentProfile> {
    if (this.config.mode === 'mock') {
      return this.mockRegisterAgent(params);
    }
    
    // TODO: On-chain implementation when program is deployed
    throw new Error('On-chain registration not yet available. Use mode: "mock" for development.');
  }

  /**
   * Get agent profile by address
   */
  async getAgent(address: PublicKey | string): Promise<AgentProfile | null> {
    const key = typeof address === 'string' ? address : address.toBase58();
    
    if (this.config.mode === 'mock') {
      return this.mockAgents.get(key) || null;
    }
    
    // TODO: On-chain implementation
    throw new Error('On-chain queries not yet available. Use mode: "mock" for development.');
  }

  /**
   * Search for agents by capabilities
   */
  async findAgents(params: {
    capabilities?: AgentCapability[];
    minReputation?: number;
    maxPrice?: bigint;
    currency?: 'SOL' | 'USDC';
    limit?: number;
  }): Promise<AgentProfile[]> {
    if (this.config.mode === 'mock') {
      return this.mockFindAgents(params);
    }
    
    throw new Error('On-chain queries not yet available. Use mode: "mock" for development.');
  }

  /**
   * Update agent profile
   */
  async updateAgent(params: {
    address: PublicKey;
    description?: string;
    endpoint?: string;
    capabilities?: AgentCapability[];
    pricing?: PricingModel;
    isActive?: boolean;
  }): Promise<AgentProfile> {
    if (this.config.mode === 'mock') {
      return this.mockUpdateAgent(params);
    }
    
    throw new Error('On-chain updates not yet available. Use mode: "mock" for development.');
  }

  // ==========================================================================
  // Task Operations
  // ==========================================================================

  /**
   * Create a new task with bounty
   */
  async createTask(params: {
    title: string;
    description: string;
    requiredCapabilities: AgentCapability[];
    bounty: bigint;
    currency: 'SOL' | 'USDC';
    deadline: Date;
  }): Promise<Task> {
    if (this.config.mode === 'mock') {
      return this.mockCreateTask(params);
    }
    
    throw new Error('On-chain task creation not yet available. Use mode: "mock" for development.');
  }

  /**
   * Get task by address
   */
  async getTask(address: PublicKey | string): Promise<Task | null> {
    const key = typeof address === 'string' ? address : address.toBase58();
    
    if (this.config.mode === 'mock') {
      return this.mockTasks.get(key) || null;
    }
    
    throw new Error('On-chain queries not yet available. Use mode: "mock" for development.');
  }

  /**
   * Search for tasks
   */
  async findTasks(filter: TaskFilter = {}): Promise<Task[]> {
    if (this.config.mode === 'mock') {
      return this.mockFindTasks(filter);
    }
    
    throw new Error('On-chain queries not yet available. Use mode: "mock" for development.');
  }

  /**
   * Claim a task as an agent
   */
  async claimTask(params: {
    task: PublicKey;
    agent: PublicKey;
  }): Promise<Task> {
    if (this.config.mode === 'mock') {
      return this.mockClaimTask(params);
    }
    
    throw new Error('On-chain task claiming not yet available. Use mode: "mock" for development.');
  }

  /**
   * Submit task deliverables
   */
  async submitTask(params: {
    task: PublicKey;
    deliverables: string[];
  }): Promise<Task> {
    if (this.config.mode === 'mock') {
      return this.mockSubmitTask(params);
    }
    
    throw new Error('On-chain task submission not yet available. Use mode: "mock" for development.');
  }

  /**
   * Approve task completion and release payment
   */
  async approveTask(params: {
    task: PublicKey;
    rating?: number; // 1-5 star rating
  }): Promise<Task> {
    if (this.config.mode === 'mock') {
      return this.mockApproveTask(params);
    }
    
    throw new Error('On-chain task approval not yet available. Use mode: "mock" for development.');
  }

  /**
   * Initiate a dispute
   */
  async disputeTask(params: {
    task: PublicKey;
    reason: string;
    evidence: string[];
  }): Promise<Dispute> {
    if (this.config.mode === 'mock') {
      return this.mockDisputeTask(params);
    }
    
    throw new Error('On-chain disputes not yet available. Use mode: "mock" for development.');
  }

  // ==========================================================================
  // Reputation Operations
  // ==========================================================================

  /**
   * Get reputation score for an agent
   */
  async getReputation(agent: PublicKey | string): Promise<ReputationScore | null> {
    const profile = await this.getAgent(agent);
    return profile?.reputation || null;
  }

  /**
   * Check if an agent meets minimum reputation requirements
   */
  async checkReputation(params: {
    agent: PublicKey;
    minScore: number;
    minTasks?: number;
    minSuccessRate?: number;
  }): Promise<{ meets: boolean; score: ReputationScore | null; reasons: string[] }> {
    const rep = await this.getReputation(params.agent);
    if (!rep) {
      return { meets: false, score: null, reasons: ['Agent not found'] };
    }

    const reasons: string[] = [];
    
    if (rep.overall < params.minScore) {
      reasons.push(`Score ${rep.overall} below minimum ${params.minScore}`);
    }
    if (params.minTasks && rep.tasksCompleted < params.minTasks) {
      reasons.push(`Tasks ${rep.tasksCompleted} below minimum ${params.minTasks}`);
    }
    if (params.minSuccessRate && rep.successRate < params.minSuccessRate) {
      reasons.push(`Success rate ${rep.successRate}% below minimum ${params.minSuccessRate}%`);
    }

    return { 
      meets: reasons.length === 0, 
      score: rep, 
      reasons 
    };
  }

  // ==========================================================================
  // Event Operations
  // ==========================================================================

  /**
   * Get recent events
   */
  async getEvents(params: {
    limit?: number;
    types?: AgentVaultEvent['type'][];
    since?: Date;
  } = {}): Promise<AgentVaultEvent[]> {
    if (this.config.mode === 'mock') {
      let events = [...this.mockEvents];
      
      if (params.types) {
        events = events.filter(e => params.types!.includes(e.type));
      }
      if (params.since) {
        events = events.filter(e => e.timestamp >= params.since!);
      }
      if (params.limit) {
        events = events.slice(-params.limit);
      }
      
      return events;
    }
    
    throw new Error('On-chain events not yet available. Use mode: "mock" for development.');
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentVaultConfig {
    return { ...this.config };
  }

  /**
   * Calculate reputation score from metrics
   */
  static calculateReputationScore(metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    totalValueHandled: bigint;
    uniqueClients: number;
    avgCompletionTime: number;
  }): number {
    const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;
    if (totalTasks === 0) return 500; // Default neutral score

    const successRate = metrics.tasksCompleted / totalTasks;
    const volumeScore = Math.min(Number(metrics.totalValueHandled) / 1000000, 100); // Cap at 100 USDC
    const clientScore = Math.min(metrics.uniqueClients * 10, 100);
    const speedScore = Math.max(0, 100 - (metrics.avgCompletionTime / 3600)); // Penalize slow completion

    // Weighted formula
    const score = (
      successRate * 400 +        // 40% weight on success rate
      volumeScore * 3 +          // 30% weight on volume
      clientScore * 2 +          // 20% weight on unique clients
      speedScore * 1             // 10% weight on speed
    );

    return Math.min(1000, Math.max(0, Math.round(score)));
  }

  // ==========================================================================
  // Mock Implementation (for development/testing)
  // ==========================================================================

  private mockRegisterAgent(params: {
    name: string;
    description: string;
    endpoint: string;
    capabilities: AgentCapability[];
    pricing: PricingModel;
    stakeAmount: bigint;
  }): AgentProfile {
    const address = Keypair.generate().publicKey;
    
    const profile: AgentProfile = {
      address,
      name: params.name,
      description: params.description,
      endpoint: params.endpoint,
      capabilities: params.capabilities,
      pricing: params.pricing,
      reputation: {
        overall: 500, // Start neutral
        tasksCompleted: 0,
        tasksFailed: 0,
        successRate: 100,
        avgCompletionTime: 0,
        totalValueHandled: BigInt(0),
        uniqueClients: 0,
        lastActiveAt: new Date()
      },
      stakedAmount: params.stakeAmount,
      registeredAt: new Date(),
      isActive: true
    };

    this.mockAgents.set(address.toBase58(), profile);
    this.mockEvents.push({
      type: 'agent_registered',
      agent: address,
      name: params.name,
      timestamp: new Date()
    });

    return profile;
  }

  private mockFindAgents(params: {
    capabilities?: AgentCapability[];
    minReputation?: number;
    maxPrice?: bigint;
    currency?: 'SOL' | 'USDC';
    limit?: number;
  }): AgentProfile[] {
    let results = Array.from(this.mockAgents.values());

    if (params.capabilities?.length) {
      results = results.filter(a => 
        params.capabilities!.some(cap => a.capabilities.includes(cap))
      );
    }
    if (params.minReputation) {
      results = results.filter(a => a.reputation.overall >= params.minReputation!);
    }
    if (params.currency) {
      results = results.filter(a => a.pricing.currency === params.currency);
    }
    if (params.maxPrice) {
      results = results.filter(a => a.pricing.baseFee <= params.maxPrice!);
    }
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  private mockUpdateAgent(params: {
    address: PublicKey;
    description?: string;
    endpoint?: string;
    capabilities?: AgentCapability[];
    pricing?: PricingModel;
    isActive?: boolean;
  }): AgentProfile {
    const key = params.address.toBase58();
    const agent = this.mockAgents.get(key);
    if (!agent) throw new Error('Agent not found');

    const updated: AgentProfile = {
      ...agent,
      ...(params.description && { description: params.description }),
      ...(params.endpoint && { endpoint: params.endpoint }),
      ...(params.capabilities && { capabilities: params.capabilities }),
      ...(params.pricing && { pricing: params.pricing }),
      ...(params.isActive !== undefined && { isActive: params.isActive })
    };

    this.mockAgents.set(key, updated);
    return updated;
  }

  private mockCreateTask(params: {
    title: string;
    description: string;
    requiredCapabilities: AgentCapability[];
    bounty: bigint;
    currency: 'SOL' | 'USDC';
    deadline: Date;
  }): Task {
    const address = Keypair.generate().publicKey;
    const escrowAddress = Keypair.generate().publicKey;
    const client = this.wallet?.publicKey || Keypair.generate().publicKey;

    const task: Task = {
      address,
      client,
      agent: null,
      title: params.title,
      description: params.description,
      requiredCapabilities: params.requiredCapabilities,
      bounty: params.bounty,
      currency: params.currency,
      status: 'open',
      deadline: params.deadline,
      createdAt: new Date(),
      escrow: escrowAddress
    };

    const escrow: Escrow = {
      address: escrowAddress,
      task: address,
      client,
      agent: null,
      amount: params.bounty,
      currency: params.currency,
      state: 'funded',
      timeout: 7 * 24 * 3600 // 7 days default
    };

    this.mockTasks.set(address.toBase58(), task);
    this.mockEscrows.set(escrowAddress.toBase58(), escrow);
    
    this.mockEvents.push({
      type: 'task_created',
      task: address,
      client,
      bounty: params.bounty,
      currency: params.currency,
      timestamp: new Date()
    });

    return task;
  }

  private mockFindTasks(filter: TaskFilter): Task[] {
    let results = Array.from(this.mockTasks.values());

    if (filter.status?.length) {
      results = results.filter(t => filter.status!.includes(t.status));
    }
    if (filter.capabilities?.length) {
      results = results.filter(t => 
        filter.capabilities!.some(cap => t.requiredCapabilities.includes(cap))
      );
    }
    if (filter.currency) {
      results = results.filter(t => t.currency === filter.currency);
    }
    if (filter.minBounty) {
      results = results.filter(t => t.bounty >= filter.minBounty!);
    }
    if (filter.maxBounty) {
      results = results.filter(t => t.bounty <= filter.maxBounty!);
    }
    if (filter.client) {
      results = results.filter(t => t.client.equals(filter.client!));
    }
    if (filter.agent) {
      results = results.filter(t => t.agent?.equals(filter.agent!));
    }

    return results;
  }

  private mockClaimTask(params: { task: PublicKey; agent: PublicKey }): Task {
    const key = params.task.toBase58();
    const task = this.mockTasks.get(key);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'open') throw new Error('Task is not open');

    const updated: Task = {
      ...task,
      agent: params.agent,
      status: 'claimed'
    };

    this.mockTasks.set(key, updated);

    // Update escrow
    const escrow = this.mockEscrows.get(task.escrow.toBase58());
    if (escrow) {
      escrow.agent = params.agent;
      escrow.state = 'locked';
      escrow.claimedAt = new Date();
    }

    this.mockEvents.push({
      type: 'task_claimed',
      task: params.task,
      agent: params.agent,
      timestamp: new Date()
    });

    return updated;
  }

  private mockSubmitTask(params: { task: PublicKey; deliverables: string[] }): Task {
    const key = params.task.toBase58();
    const task = this.mockTasks.get(key);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'claimed' && task.status !== 'in_progress') {
      throw new Error('Task cannot be submitted in current state');
    }

    const updated: Task = {
      ...task,
      status: 'submitted',
      deliverables: params.deliverables
    };

    this.mockTasks.set(key, updated);
    return updated;
  }

  private mockApproveTask(params: { task: PublicKey; rating?: number }): Task {
    const key = params.task.toBase58();
    const task = this.mockTasks.get(key);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'submitted') throw new Error('Task not in submitted state');

    const updated: Task = {
      ...task,
      status: 'approved',
      completedAt: new Date()
    };

    this.mockTasks.set(key, updated);

    // Update escrow
    const escrow = this.mockEscrows.get(task.escrow.toBase58());
    if (escrow) {
      escrow.state = 'released';
      this.mockEvents.push({
        type: 'escrow_released',
        escrow: escrow.address,
        task: params.task,
        recipient: task.agent!,
        amount: escrow.amount,
        timestamp: new Date()
      });
    }

    // Update agent reputation
    if (task.agent) {
      const agent = this.mockAgents.get(task.agent.toBase58());
      if (agent) {
        agent.reputation.tasksCompleted++;
        agent.reputation.totalValueHandled += task.bounty;
        agent.reputation.lastActiveAt = new Date();
        agent.reputation.overall = AgentVaultClient.calculateReputationScore({
          tasksCompleted: agent.reputation.tasksCompleted,
          tasksFailed: agent.reputation.tasksFailed,
          totalValueHandled: agent.reputation.totalValueHandled,
          uniqueClients: agent.reputation.uniqueClients + 1,
          avgCompletionTime: agent.reputation.avgCompletionTime
        });

        this.mockEvents.push({
          type: 'reputation_updated',
          agent: task.agent,
          oldScore: agent.reputation.overall,
          newScore: agent.reputation.overall,
          reason: 'task_completed',
          timestamp: new Date()
        });
      }
    }

    this.mockEvents.push({
      type: 'task_completed',
      task: params.task,
      agent: task.agent!,
      client: task.client,
      bounty: task.bounty,
      timestamp: new Date()
    });

    return updated;
  }

  private mockDisputeTask(params: { 
    task: PublicKey; 
    reason: string; 
    evidence: string[] 
  }): Dispute {
    const taskKey = params.task.toBase58();
    const task = this.mockTasks.get(taskKey);
    if (!task) throw new Error('Task not found');

    const disputeAddress = Keypair.generate().publicKey;
    const initiator = this.wallet?.publicKey || Keypair.generate().publicKey;

    const dispute: Dispute = {
      address: disputeAddress,
      task: params.task,
      initiator,
      reason: params.reason,
      evidence: params.evidence,
      status: 'pending',
      createdAt: new Date()
    };

    // Update task status
    task.status = 'disputed';
    this.mockTasks.set(taskKey, task);

    // Update escrow
    const escrow = this.mockEscrows.get(task.escrow.toBase58());
    if (escrow) {
      escrow.state = 'disputed';
    }

    this.mockDisputes.set(disputeAddress.toBase58(), dispute);
    
    this.mockEvents.push({
      type: 'task_disputed',
      task: params.task,
      dispute: disputeAddress,
      initiator,
      timestamp: new Date()
    });

    return dispute;
  }
}

// ============================================================================
// Export default client factory
// ============================================================================

export function createAgentVaultClient(config?: Partial<AgentVaultConfig>): AgentVaultClient {
  return new AgentVaultClient(config);
}
