use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Agent, Service, Task, TaskStatus, GlobalState};
use crate::errors::AgentVaultError;
use crate::events::TaskCreated;

#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = client_authority,
        space = Task::SPACE,
        seeds = [b"task", (global_state.task_counter + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub task: Account<'info, Task>,

    /// The escrow account that holds the funds (created as a PDA)
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

    /// Client agent requesting the work
    #[account(
        seeds = [b"agent", client_authority.key().as_ref()],
        bump = client_agent.bump,
        constraint = client_agent.authority == client_authority.key() @ AgentVaultError::Unauthorized
    )]
    pub client_agent: Account<'info, Agent>,

    /// Provider agent that will do the work
    #[account(
        constraint = provider_agent.key() != client_agent.key() @ AgentVaultError::ClientCannotBeProvider
    )]
    pub provider_agent: Account<'info, Agent>,

    /// Service being requested
    #[account(
        constraint = service.agent == provider_agent.key() @ AgentVaultError::Unauthorized,
        constraint = service.active @ AgentVaultError::ServiceNotActive
    )]
    pub service: Account<'info, Service>,

    #[account(mut)]
    pub client_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateTask>, escrow_amount: u64) -> Result<()> {
    let service = &ctx.accounts.service;

    // Validate escrow amount
    require!(escrow_amount > 0, AgentVaultError::InvalidEscrowAmount);
    require!(escrow_amount >= service.price, AgentVaultError::InsufficientFunds);

    let task = &mut ctx.accounts.task;
    let global_state = &mut ctx.accounts.global_state;
    let clock = Clock::get()?;

    // Increment task counter
    let task_id = global_state.task_counter
        .checked_add(1)
        .ok_or(AgentVaultError::ArithmeticOverflow)?;
    global_state.task_counter = task_id;
    global_state.total_tasks = global_state.total_tasks
        .checked_add(1)
        .ok_or(AgentVaultError::ArithmeticOverflow)?;

    // Initialize task
    task.id = task_id;
    task.client = ctx.accounts.client_agent.key();
    task.provider = ctx.accounts.provider_agent.key();
    task.service = ctx.accounts.service.key();
    task.escrow = escrow_amount;
    task.status = TaskStatus::Pending;
    task.created_at = clock.unix_timestamp;
    task.completed_at = None;
    task.bump = ctx.bumps.task;

    // Transfer funds to escrow
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.client_authority.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        escrow_amount,
    )?;

    // Emit event
    emit!(TaskCreated {
        task: task.key(),
        task_id,
        client: ctx.accounts.client_agent.key(),
        provider: ctx.accounts.provider_agent.key(),
        service: ctx.accounts.service.key(),
        escrow_amount,
        timestamp: clock.unix_timestamp,
    });

    msg!("Task created: {} with escrow: {}", task.key(), escrow_amount);
    Ok(())
}
