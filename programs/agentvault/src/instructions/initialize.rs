use anchor_lang::prelude::*;
use crate::state::GlobalState;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = GlobalState::SPACE,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    global_state.authority = ctx.accounts.authority.key();
    global_state.task_counter = 0;
    global_state.total_tasks = 0;
    global_state.total_completed = 0;
    global_state.total_agents = 0;
    global_state.bump = ctx.bumps.global_state;

    msg!("Global state initialized");
    Ok(())
}
