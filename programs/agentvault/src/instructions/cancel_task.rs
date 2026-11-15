use anchor_lang::prelude::*;
use anchor_lang::system_program;
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
    let task_key = ctx.accounts.task.key();
    let escrow_bump = ctx.bumps.escrow;
    let refund_amount = ctx.accounts.task.escrow;

    let task = &mut ctx.accounts.task;
    let clock = Clock::get()?;

    // Update task status
    task.status = TaskStatus::Cancelled;
    task.escrow = 0;

    // Refund escrow to client. The escrow PDA is system-owned, so a direct
    // lamport debit is rejected by the runtime; sign a system transfer instead.
    let seeds: &[&[u8]] = &[b"escrow", task_key.as_ref(), &[escrow_bump]];
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.client_authority.to_account_info(),
            },
            &[seeds],
        ),
        refund_amount,
    )?;

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
