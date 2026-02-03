use anchor_lang::prelude::*;
use crate::state::{Agent, Task, TaskStatus};
use crate::errors::AgentVaultError;
use crate::events::TaskCancelled;

#[derive(Accounts)]
pub struct CancelTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task.id.to_le_bytes().as_ref()],
        bump = task.bump,
        constraint = task.status == TaskStatus::Pending @ AgentVaultError::TaskCannotBeCancelled,
        constraint = task.client == client_agent.key() @ AgentVaultError::Unauthorized
    )]
    pub task: Account<'info, Task>,

    /// Escrow account holding the funds
    /// CHECK: This is a PDA used as escrow, validated by seeds
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump
    )]
    pub escrow: UncheckedAccount<'info>,

    /// Client agent cancelling the task
    #[account(
        seeds = [b"agent", client_authority.key().as_ref()],
        bump = client_agent.bump
    )]
    pub client_agent: Account<'info, Agent>,

    #[account(
        mut,
        constraint = client_authority.key() == client_agent.authority @ AgentVaultError::Unauthorized
    )]
    pub client_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelTask>) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let clock = Clock::get()?;

    let refund_amount = task.escrow;

    // Update task status
    task.status = TaskStatus::Cancelled;
    task.escrow = 0;

    // Refund escrow to client
    **ctx.accounts.escrow.try_borrow_mut_lamports()? -= refund_amount;
    **ctx.accounts.client_authority.try_borrow_mut_lamports()? += refund_amount;

    // Emit event
    emit!(TaskCancelled {
        task: task.key(),
        task_id: task.id,
        refund_amount,
        timestamp: clock.unix_timestamp,
    });

    msg!("Task cancelled: {}, refunded: {}", task.key(), refund_amount);
    Ok(())
}
