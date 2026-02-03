use anchor_lang::prelude::*;
use crate::state::{Agent, Task, TaskStatus};
use crate::errors::AgentVaultError;
use crate::events::TaskAccepted;

#[derive(Accounts)]
pub struct AcceptTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task.id.to_le_bytes().as_ref()],
        bump = task.bump,
        constraint = task.status == TaskStatus::Pending @ AgentVaultError::TaskNotPending,
        constraint = task.provider == provider_agent.key() @ AgentVaultError::Unauthorized
    )]
    pub task: Account<'info, Task>,

    /// Provider agent accepting the task
    #[account(
        seeds = [b"agent", provider_authority.key().as_ref()],
        bump = provider_agent.bump,
        constraint = provider_agent.authority == provider_authority.key() @ AgentVaultError::Unauthorized
    )]
    pub provider_agent: Account<'info, Agent>,

    pub provider_authority: Signer<'info>,
}

pub fn handler(ctx: Context<AcceptTask>) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let clock = Clock::get()?;

    // Update task status
    task.status = TaskStatus::InProgress;

    // Emit event
    emit!(TaskAccepted {
        task: task.key(),
        task_id: task.id,
        provider: ctx.accounts.provider_agent.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Task accepted: {}", task.key());
    Ok(())
}
