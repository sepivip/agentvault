use anchor_lang::prelude::*;
use crate::state::{Agent, GlobalState, MAX_AGENT_NAME_LEN, MAX_METADATA_URI_LEN};
use crate::errors::AgentVaultError;
use crate::events::AgentRegistered;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = Agent::SPACE,
        seeds = [b"agent", authority.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterAgent>,
    name: String,
    metadata_uri: String,
) -> Result<()> {
    // Validate inputs
    require!(!name.is_empty(), AgentVaultError::AgentNameEmpty);
    require!(name.len() <= MAX_AGENT_NAME_LEN, AgentVaultError::AgentNameTooLong);
    require!(metadata_uri.len() <= MAX_METADATA_URI_LEN, AgentVaultError::MetadataUriTooLong);

    let agent = &mut ctx.accounts.agent;
    let global_state = &mut ctx.accounts.global_state;
    let clock = Clock::get()?;

    // Initialize agent account
    agent.authority = ctx.accounts.authority.key();
    agent.name = name.clone();
    agent.metadata_uri = metadata_uri;
    agent.reputation = 0;
    agent.tasks_completed = 0;
    agent.tasks_failed = 0;
    agent.created_at = clock.unix_timestamp;
    agent.bump = ctx.bumps.agent;

    // Update global state
    global_state.total_agents = global_state.total_agents
        .checked_add(1)
        .ok_or(AgentVaultError::ArithmeticOverflow)?;

    // Emit event
    emit!(AgentRegistered {
        agent: agent.key(),
        authority: ctx.accounts.authority.key(),
        name,
        timestamp: clock.unix_timestamp,
    });

    msg!("Agent registered: {}", agent.key());
    Ok(())
}
