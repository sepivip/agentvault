use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("AgVt6Bq8E82NLXhN5ZfXqvJxJZxu8XYD4P8RSFEYxJHd");

#[program]
pub mod agentvault {
    use super::*;

    /// Initialize the global state for the protocol
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Register a new agent with on-chain identity
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        metadata_uri: String,
    ) -> Result<()> {
        instructions::register_agent::handler(ctx, name, metadata_uri)
    }

    /// Update agent name and/or metadata
    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        name: Option<String>,
        metadata_uri: Option<String>,
    ) -> Result<()> {
        instructions::update_agent::handler(ctx, name, metadata_uri)
    }

    /// Create a new service listing
    pub fn create_service(
        ctx: Context<CreateService>,
        name: String,
        description: String,
        price: u64,
    ) -> Result<()> {
        instructions::create_service::handler(ctx, name, description, price)
    }

    /// Update service description and/or price
    pub fn update_service(
        ctx: Context<UpdateService>,
        description: Option<String>,
        price: Option<u64>,
    ) -> Result<()> {
        instructions::update_service::handler(ctx, description, price)
    }

    /// Deactivate a service
    pub fn deactivate_service(ctx: Context<DeactivateService>) -> Result<()> {
        instructions::deactivate_service::handler(ctx)
    }

    /// Create a new task with escrow
    pub fn create_task(ctx: Context<CreateTask>, escrow_amount: u64) -> Result<()> {
        instructions::create_task::handler(ctx, escrow_amount)
    }

    /// Accept a pending task (provider)
    pub fn accept_task(ctx: Context<AcceptTask>) -> Result<()> {
        instructions::accept_task::handler(ctx)
    }

    /// Complete a task and release escrow (client confirms)
    pub fn complete_task(ctx: Context<CompleteTask>) -> Result<()> {
        instructions::complete_task::handler(ctx)
    }

    /// Dispute a task in progress
    pub fn dispute_task(ctx: Context<DisputeTask>) -> Result<()> {
        instructions::dispute_task::handler(ctx)
    }

    /// Cancel a pending task and refund escrow
    pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
        instructions::cancel_task::handler(ctx)
    }
}
