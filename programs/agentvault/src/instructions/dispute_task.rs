use anchor_lang::prelude::*;
use crate::state::{Agent, Task, TaskStatus};
use crate::errors::AgentVaultError;
use crate::events::TaskDisputed;

#[derive(Accounts)]
pub struct DisputeTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task.id.to_le_bytes().as_ref()],
        bump = task.bump,
        constraint = task.status == TaskStatus::InProgress @ AgentVaultError::TaskNotInProgress
    )]
    pub task: Account<'info, Task>,

    /// Agent disputing the task (must be client or provider)
    #[account(
        seeds = [b"agent", disputer_authority.key().as_ref()],
        bump = disputer_agent.bump,
        constraint = (
            disputer_agent.key() == task.client ||
            disputer_agent.key() == task.provider
        ) @ AgentVaultError::OnlyParticipantsCanDispute
    )]
    pub disputer_agent: Account<'info, Agent>,

    #[account(
        constraint = disputer_authority.key() == disputer_agent.authority @ AgentVaultError::Unauthorized
    )]
    pub disputer_authority: Signer<'info>,
}

pub fn handler(ctx: Context<DisputeTask>) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let clock = Clock::get()?;

    // Update task status to disputed
    task.status = TaskStatus::Disputed;

    // Emit event
    emit!(TaskDisputed {
        task: task.key(),
        task_id: task.id,
        disputer: ctx.accounts.disputer_agent.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Task disputed: {}", task.key());
    Ok(())
}
