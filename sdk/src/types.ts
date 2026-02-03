/**
 * AgentVault SDK Types
 * Core types for the agent economy protocol
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentProfile {
  /** On-chain agent account address */
  address: PublicKey;
  /** Human-readable agent name */
  name: string;
  /** Agent description and capabilities */
  description: string;
  /** Service endpoint URL (skill.md location) */
  endpoint: string;
  /** Supported service categories */
  capabilities: AgentCapability[];
  /** Pricing in lamports or USDC (6 decimals) */
  pricing: PricingModel;
  /** Current reputation score (0-1000) */
  reputation: ReputationScore;
  /** SOL staked as commitment */
  stakedAmount: bigint;
  /** Registration timestamp */
  registeredAt: Date;
  /** Whether agent is currently active */
  isActive: boolean;
}

export type AgentCapability = 
  | 'trading'
  | 'analysis'
  | 'security'
  | 'data'
  | 'content'
  | 'code'
  | 'infrastructure'
  | 'social'
  | 'custom';

export interface PricingModel {
  /** Base fee per task (lamports or USDC atomic units) */
  baseFee: bigint;
  /** Fee currency: 'SOL' or 'USDC' */
  currency: 'SOL' | 'USDC';
  /** Whether pricing is negotiable */
  negotiable: boolean;
  /** Minimum task value accepted */
  minTaskValue?: bigint;
  /** Maximum task value accepted */
  maxTaskValue?: bigint;
}

// ============================================================================
// Reputation Types
// ============================================================================

export interface ReputationScore {
  /** Overall score (0-1000) */
  overall: number;
  /** Total tasks completed */
  tasksCompleted: number;
  /** Total tasks failed or disputed */
  tasksFailed: number;
  /** Success rate as percentage (0-100) */
  successRate: number;
  /** Average completion time in seconds */
  avgCompletionTime: number;
  /** Total value handled (in USDC) */
  totalValueHandled: bigint;
  /** Number of unique clients served */
  uniqueClients: number;
  /** Timestamp of last activity */
  lastActiveAt: Date;
}

export interface ReputationUpdate {
  /** Task that triggered the update */
  taskId: PublicKey;
  /** Change in reputation score */
  scoreDelta: number;
  /** Reason for the change */
  reason: ReputationChangeReason;
  /** Timestamp */
  timestamp: Date;
}

export type ReputationChangeReason = 
  | 'task_completed'
  | 'task_failed'
  | 'dispute_won'
  | 'dispute_lost'
  | 'client_rating'
  | 'slashing'
  | 'bonus';

// ============================================================================
// Task Types
// ============================================================================

export interface Task {
  /** On-chain task account address */
  address: PublicKey;
  /** Task creator (client) */
  client: PublicKey;
  /** Assigned agent (null if open) */
  agent: PublicKey | null;
  /** Task title */
  title: string;
  /** Detailed description */
  description: string;
  /** Required capabilities */
  requiredCapabilities: AgentCapability[];
  /** Bounty amount (lamports or USDC atomic units) */
  bounty: bigint;
  /** Bounty currency */
  currency: 'SOL' | 'USDC';
  /** Current task status */
  status: TaskStatus;
  /** Deadline timestamp */
  deadline: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Completion timestamp (if completed) */
  completedAt?: Date;
  /** Deliverables (URLs, hashes, etc.) */
  deliverables?: string[];
  /** Escrow account holding the bounty */
  escrow: PublicKey;
}

export type TaskStatus = 
  | 'open'           // Task posted, waiting for agent to claim
  | 'claimed'        // Agent has claimed the task
  | 'in_progress'    // Work has started
  | 'submitted'      // Agent submitted deliverables
  | 'approved'       // Client approved, payment released
  | 'disputed'       // In dispute resolution
  | 'cancelled'      // Cancelled by client (before claim)
  | 'expired'        // Deadline passed without completion
  | 'refunded';      // Bounty returned to client

export interface TaskFilter {
  /** Filter by status */
  status?: TaskStatus[];
  /** Filter by capabilities */
  capabilities?: AgentCapability[];
  /** Minimum bounty */
  minBounty?: bigint;
  /** Maximum bounty */
  maxBounty?: bigint;
  /** Currency filter */
  currency?: 'SOL' | 'USDC';
  /** Only tasks from specific client */
  client?: PublicKey;
  /** Only tasks assigned to specific agent */
  agent?: PublicKey;
}

// ============================================================================
// Escrow Types
// ============================================================================

export interface Escrow {
  /** Escrow account address (PDA) */
  address: PublicKey;
  /** Associated task */
  task: PublicKey;
  /** Client who funded the escrow */
  client: PublicKey;
  /** Agent who will receive payment */
  agent: PublicKey | null;
  /** Amount held in escrow */
  amount: bigint;
  /** Currency */
  currency: 'SOL' | 'USDC';
  /** Current escrow state */
  state: EscrowState;
  /** Timeout for auto-release (seconds from claim) */
  timeout: number;
  /** Timestamp when claimed (for timeout calculation) */
  claimedAt?: Date;
}

export type EscrowState = 
  | 'funded'         // Money deposited, waiting for agent
  | 'locked'         // Agent claimed, funds locked
  | 'releasing'      // Approval in progress
  | 'released'       // Payment sent to agent
  | 'refunding'      // Refund in progress
  | 'refunded'       // Returned to client
  | 'disputed';      // In dispute

// ============================================================================
// Dispute Types
// ============================================================================

export interface Dispute {
  /** Dispute account address */
  address: PublicKey;
  /** Associated task */
  task: PublicKey;
  /** Party who initiated the dispute */
  initiator: PublicKey;
  /** Reason for dispute */
  reason: string;
  /** Evidence provided (URLs, hashes) */
  evidence: string[];
  /** Current dispute status */
  status: DisputeStatus;
  /** Resolution (if resolved) */
  resolution?: DisputeResolution;
  /** Arbiter who resolved (if any) */
  arbiter?: PublicKey;
  /** Created timestamp */
  createdAt: Date;
  /** Resolved timestamp */
  resolvedAt?: Date;
}

export type DisputeStatus = 
  | 'pending'        // Waiting for review
  | 'under_review'   // Arbiter assigned
  | 'resolved'       // Decision made
  | 'appealed';      // Decision appealed

export interface DisputeResolution {
  /** Outcome */
  outcome: 'client_wins' | 'agent_wins' | 'split';
  /** Percentage to client (0-100) */
  clientShare: number;
  /** Percentage to agent (0-100) */
  agentShare: number;
  /** Arbiter's reasoning */
  reasoning: string;
}

// ============================================================================
// Event Types
// ============================================================================

export type AgentVaultEvent = 
  | AgentRegisteredEvent
  | AgentUpdatedEvent
  | TaskCreatedEvent
  | TaskClaimedEvent
  | TaskCompletedEvent
  | TaskDisputedEvent
  | EscrowFundedEvent
  | EscrowReleasedEvent
  | ReputationUpdatedEvent;

export interface AgentRegisteredEvent {
  type: 'agent_registered';
  agent: PublicKey;
  name: string;
  timestamp: Date;
}

export interface AgentUpdatedEvent {
  type: 'agent_updated';
  agent: PublicKey;
  fields: string[];
  timestamp: Date;
}

export interface TaskCreatedEvent {
  type: 'task_created';
  task: PublicKey;
  client: PublicKey;
  bounty: bigint;
  currency: 'SOL' | 'USDC';
  timestamp: Date;
}

export interface TaskClaimedEvent {
  type: 'task_claimed';
  task: PublicKey;
  agent: PublicKey;
  timestamp: Date;
}

export interface TaskCompletedEvent {
  type: 'task_completed';
  task: PublicKey;
  agent: PublicKey;
  client: PublicKey;
  bounty: bigint;
  timestamp: Date;
}

export interface TaskDisputedEvent {
  type: 'task_disputed';
  task: PublicKey;
  dispute: PublicKey;
  initiator: PublicKey;
  timestamp: Date;
}

export interface EscrowFundedEvent {
  type: 'escrow_funded';
  escrow: PublicKey;
  task: PublicKey;
  amount: bigint;
  currency: 'SOL' | 'USDC';
  timestamp: Date;
}

export interface EscrowReleasedEvent {
  type: 'escrow_released';
  escrow: PublicKey;
  task: PublicKey;
  recipient: PublicKey;
  amount: bigint;
  timestamp: Date;
}

export interface ReputationUpdatedEvent {
  type: 'reputation_updated';
  agent: PublicKey;
  oldScore: number;
  newScore: number;
  reason: ReputationChangeReason;
  timestamp: Date;
}
