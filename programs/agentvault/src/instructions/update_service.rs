use anchor_lang::prelude::*;
use crate::state::{Agent, Service, MAX_SERVICE_DESC_LEN};
use crate::errors::AgentVaultError;
use crate::events::ServiceUpdated;

#[derive(Accounts)]
pub struct UpdateService<'info> {
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

pub fn handler(
    ctx: Context<UpdateService>,
    description: Option<String>,
    price: Option<u64>,
) -> Result<()> {
    let service = &mut ctx.accounts.service;
    let clock = Clock::get()?;

    // Update description if provided
    if let Some(new_desc) = description {
        require!(new_desc.len() <= MAX_SERVICE_DESC_LEN, AgentVaultError::ServiceDescriptionTooLong);
        service.description = new_desc;
    }

    // Update price if provided
    if let Some(new_price) = price {
        require!(new_price > 0, AgentVaultError::InvalidPrice);
        service.price = new_price;
    }

    // Emit event
    emit!(ServiceUpdated {
        service: service.key(),
        name: service.name.clone(),
        price: service.price,
        timestamp: clock.unix_timestamp,
    });

    msg!("Service updated: {}", service.key());
    Ok(())
}
