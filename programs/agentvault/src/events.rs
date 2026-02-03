use anchor_lang::prelude::*;

#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct AgentUpdated {
    pub agent: Pubkey,
    pub name: String,
    pub metadata_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct ServiceCreated {
    pub service: Pubkey,
    pub agent: Pubkey,
    pub name: String,
    pub price: u64,
    pub timestamp: i64,
}

#[event]
pub struct ServiceUpdated {
    pub service: Pubkey,
    pub name: String,
    pub price: u64,
    pub timestamp: i64,
}

#[event]
pub struct ServiceDeactivated {
    pub service: Pubkey,
    pub agent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TaskCreated {
    pub task: Pubkey,
    pub task_id: u64,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub service: Pubkey,
    pub escrow_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TaskAccepted {
    pub task: Pubkey,
    pub task_id: u64,
    pub provider: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TaskCompleted {
    pub task: Pubkey,
    pub task_id: u64,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub escrow_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TaskDisputed {
    pub task: Pubkey,
    pub task_id: u64,
    pub disputer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TaskCancelled {
    pub task: Pubkey,
    pub task_id: u64,
    pub refund_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ReputationUpdated {
    pub agent: Pubkey,
    pub new_reputation: u64,
    pub tasks_completed: u64,
    pub timestamp: i64,
}
