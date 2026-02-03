use anchor_lang::prelude::*;
use crate::state::{Agent, Service, MAX_SERVICE_NAME_LEN, MAX_SERVICE_DESC_LEN};
use crate::errors::AgentVaultError;
use crate::events::ServiceCreated;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateService<'info> {
    #[account(
        init,
        payer = authority,
        space = Service::SPACE,
        seeds = [b"service", agent.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub service: Account<'info, Service>,

    #[account(
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = authority @ AgentVaultError::Unauthorized
    )]
    pub agent: Account<'info, Agent>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateService>,
    name: String,
    description: String,
    price: u64,
) -> Result<()> {
    // Validate inputs
    require!(!name.is_empty(), AgentVaultError::ServiceNameEmpty);
    require!(name.len() <= MAX_SERVICE_NAME_LEN, AgentVaultError::ServiceNameTooLong);
    require!(description.len() <= MAX_SERVICE_DESC_LEN, AgentVaultError::ServiceDescriptionTooLong);
    require!(price > 0, AgentVaultError::InvalidPrice);

    let service = &mut ctx.accounts.service;
    let clock = Clock::get()?;

    // Initialize service account
    service.agent = ctx.accounts.agent.key();
    service.name = name.clone();
    service.description = description;
    service.price = price;
    service.active = true;
    service.bump = ctx.bumps.service;

    // Emit event
    emit!(ServiceCreated {
        service: service.key(),
        agent: ctx.accounts.agent.key(),
        name,
        price,
        timestamp: clock.unix_timestamp,
    });

    msg!("Service created: {}", service.key());
    Ok(())
}
