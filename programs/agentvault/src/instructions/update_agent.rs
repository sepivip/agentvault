use anchor_lang::prelude::*;
use crate::state::{Agent, MAX_AGENT_NAME_LEN, MAX_METADATA_URI_LEN};
use crate::errors::AgentVaultError;
use crate::events::AgentUpdated;

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = authority @ AgentVaultError::Unauthorized
    )]
    pub agent: Account<'info, Agent>,

    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateAgent>,
    name: Option<String>,
    metadata_uri: Option<String>,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    // Update name if provided
    if let Some(new_name) = name {
        require!(!new_name.is_empty(), AgentVaultError::AgentNameEmpty);
        require!(new_name.len() <= MAX_AGENT_NAME_LEN, AgentVaultError::AgentNameTooLong);
        agent.name = new_name;
    }

    // Update metadata URI if provided
    if let Some(new_uri) = metadata_uri {
        require!(new_uri.len() <= MAX_METADATA_URI_LEN, AgentVaultError::MetadataUriTooLong);
        agent.metadata_uri = new_uri;
    }

    // Emit event
    emit!(AgentUpdated {
        agent: agent.key(),
        name: agent.name.clone(),
        metadata_uri: agent.metadata_uri.clone(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Agent updated: {}", agent.key());
    Ok(())
}
