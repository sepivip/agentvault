use anchor_lang::prelude::*;

/// Maximum length for agent name
pub const MAX_AGENT_NAME_LEN: usize = 32;
/// Maximum length for service name
pub const MAX_SERVICE_NAME_LEN: usize = 64;
/// Maximum length for service description
pub const MAX_SERVICE_DESC_LEN: usize = 256;
/// Maximum length for metadata URI
pub const MAX_METADATA_URI_LEN: usize = 200;

/// Base reputation points awarded per completed task
pub const REPUTATION_PER_TASK: u64 = 10;

/// Agent account - represents an AI agent on-chain
#[account]
#[derive(InitSpace)]
pub struct Agent {
    /// Owner wallet that controls this agent
    pub authority: Pubkey,
    /// Agent display name (max 32 chars)
    #[max_len(MAX_AGENT_NAME_LEN)]
    pub name: String,
    /// IPFS/Arweave link to extended metadata
    #[max_len(MAX_METADATA_URI_LEN)]
    pub metadata_uri: String,
    /// Reputation score earned through completed tasks
    pub reputation: u64,
    /// Total number of successfully completed tasks
    pub tasks_completed: u64,
    /// Total number of failed/disputed tasks
    pub tasks_failed: u64,
    /// Unix timestamp of agent registration
    pub created_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl Agent {
    /// Calculate the space needed for this account
    pub const SPACE: usize = 8 + // discriminator
        32 + // authority
        4 + MAX_AGENT_NAME_LEN + // name (4 bytes for length prefix)
        4 + MAX_METADATA_URI_LEN + // metadata_uri
        8 + // reputation
        8 + // tasks_completed
        8 + // tasks_failed
        8 + // created_at
        1;  // bump
}

/// Service account - represents a service offered by an agent
#[account]
#[derive(InitSpace)]
pub struct Service {
    /// PDA of the agent offering this service
    pub agent: Pubkey,
    /// Service name (max 64 chars)
    #[max_len(MAX_SERVICE_NAME_LEN)]
    pub name: String,
    /// Service description (max 256 chars)
    #[max_len(MAX_SERVICE_DESC_LEN)]
    pub description: String,
    /// Price in lamports (can be used for USDC with decimals)
    pub price: u64,
    /// Whether the service is currently active
    pub active: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl Service {
    /// Calculate the space needed for this account
    pub const SPACE: usize = 8 + // discriminator
        32 + // agent
        4 + MAX_SERVICE_NAME_LEN + // name
        4 + MAX_SERVICE_DESC_LEN + // description
        8 + // price
        1 + // active
        1;  // bump
}

/// Task status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum TaskStatus {
    /// Task created, waiting for provider to accept
    Pending,
    /// Provider accepted, work in progress
    InProgress,
    /// Task completed and confirmed
    Completed,
    /// Task disputed by either party
    Disputed,
    /// Task cancelled before completion
    Cancelled,
}

impl Default for TaskStatus {
    fn default() -> Self {
        TaskStatus::Pending
    }
}

/// Task account - represents a work request between agents
#[account]
#[derive(InitSpace)]
pub struct Task {
    /// Unique task identifier
    pub id: u64,
    /// Agent PDA requesting work (client)
    pub client: Pubkey,
    /// Agent PDA performing work (provider)
    pub provider: Pubkey,
    /// Service PDA being used
    pub service: Pubkey,
    /// Amount locked in escrow (lamports)
    pub escrow: u64,
    /// Current task status
    pub status: TaskStatus,
    /// Unix timestamp of task creation
    pub created_at: i64,
    /// Unix timestamp of task completion (if completed)
    pub completed_at: Option<i64>,
    /// PDA bump seed
    pub bump: u8,
}

impl Task {
    /// Calculate the space needed for this account
    pub const SPACE: usize = 8 + // discriminator
        8 + // id
        32 + // client
        32 + // provider
        32 + // service
        8 + // escrow
        1 + // status (enum)
        8 + // created_at
        1 + 8 + // completed_at (Option<i64>)
        1;  // bump
}

/// Global state for tracking task IDs
#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    /// Authority that can update global state
    pub authority: Pubkey,
    /// Counter for generating unique task IDs
    pub task_counter: u64,
    /// Total tasks created
    pub total_tasks: u64,
    /// Total tasks completed
    pub total_completed: u64,
    /// Total agents registered
    pub total_agents: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl GlobalState {
    pub const SPACE: usize = 8 + // discriminator
        32 + // authority
        8 + // task_counter
        8 + // total_tasks
        8 + // total_completed
        8 + // total_agents
        1;  // bump
}
