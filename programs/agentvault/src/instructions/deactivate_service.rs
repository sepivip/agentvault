use anchor_lang::prelude::*;
use crate::state::{Agent, Service};
use crate::errors::AgentVaultError;
use crate::events::ServiceDeactivated;

#[derive(Accounts)]
pub struct DeactivateService<'info> {
    #[account(
        mut,
        seeds = [b"service", agent.key().as_ref(), service.name.as_bytes()],
        bump = service.bump,
        has_one = agent
    )]
    pub service: Account<'info, Service>,

    #[account(
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = authority @ AgentVaultError::Unauthorized
    )]
    pub agent: Account<'info, Agent>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<DeactivateService>) -> Result<()> {
    let service = &mut ctx.accounts.service;
    let clock = Clock::get()?;

    service.active = false;

    // Emit event
    emit!(ServiceDeactivated {
        service: service.key(),
        agent: ctx.accounts.agent.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Service deactivated: {}", service.key());
    Ok(())
}
