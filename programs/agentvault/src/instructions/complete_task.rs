use anchor_lang::prelude::*;
use crate::state::{Agent, Task, TaskStatus, GlobalState, REPUTATION_PER_TASK};
use crate::errors::AgentVaultError;
use crate::events::{TaskCompleted, ReputationUpdated};

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task.id.to_le_bytes().as_ref()],
        bump = task.bump,
        constraint = task.status == TaskStatus::InProgress @ AgentVaultError::TaskNotInProgress,
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

    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// Client agent confirming completion
    #[account(
        seeds = [b"agent", client_authority.key().as_ref()],
        bump = client_agent.bump
    )]
    pub client_agent: Account<'info, Agent>,

    /// Provider agent who completed the work
    #[account(
        mut,
        constraint = provider_agent.key() == task.provider @ AgentVaultError::Unauthorized
    )]
    pub provider_agent: Account<'info, Agent>,

    /// Provider's authority to receive funds
    /// CHECK: This is the authority of the provider agent
    #[account(
        mut,
        constraint = provider_authority.key() == provider_agent.authority @ AgentVaultError::Unauthorized
    )]
    pub provider_authority: UncheckedAccount<'info>,

    #[account(
        constraint = client_authority.key() == client_agent.authority @ AgentVaultError::Unauthorized
    )]
    pub client_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CompleteTask>) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let provider_agent = &mut ctx.accounts.provider_agent;
    let global_state = &mut ctx.accounts.global_state;
    let clock = Clock::get()?;

    let escrow_amount = task.escrow;

    // Update task status
    task.status = TaskStatus::Completed;
    task.completed_at = Some(clock.unix_timestamp);

    // Update provider stats
    provider_agent.tasks_completed = provider_agent.tasks_completed
        .checked_add(1)
        .ok_or(AgentVaultError::ArithmeticOverflow)?;
    provider_agent.reputation = provider_agent.reputation
        .checked_add(REPUTATION_PER_TASK)
        .ok_or(AgentVaultError::ArithmeticOverflow)?;

    // Update global stats
    global_state.total_completed = global_state.total_completed
        .checked_add(1)
        .ok_or(AgentVaultError::ArithmeticOverflow)?;

    // Transfer escrow to provider
    **ctx.accounts.escrow.try_borrow_mut_lamports()? -= escrow_amount;
    **ctx.accounts.provider_authority.try_borrow_mut_lamports()? += escrow_amount;

    // Emit events
    emit!(TaskCompleted {
        task: task.key(),
        task_id: task.id,
        client: ctx.accounts.client_agent.key(),
        provider: provider_agent.key(),
        escrow_amount,
        timestamp: clock.unix_timestamp,
    });

    emit!(ReputationUpdated {
        agent: provider_agent.key(),
        new_reputation: provider_agent.reputation,
        tasks_completed: provider_agent.tasks_completed,
        timestamp: clock.unix_timestamp,
    });

    msg!("Task completed: {}, funds released: {}", task.key(), escrow_amount);
    Ok(())
}
