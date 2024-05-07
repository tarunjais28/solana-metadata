use super::*;

/// Function to initialize the contract
pub fn initialize(ctx: Context<Initialize>, whitelisted_users: Vec<Pubkey>) -> Result<()> {
    let caller = ctx.accounts.authority.to_account_info().key();
    let maintainers = &mut ctx.accounts.maintainers;
    maintainers.save(caller);

    let whitelist = &mut ctx.accounts.whitelist;
    whitelist.save(whitelisted_users);

    // Emit init event
    emit!(InitEvent {
        admin: caller,
        sub_admin: caller
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(whitelisted_users: Vec<Pubkey>)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [MAINTAINERS_TAG],
        bump,
        payer = authority,
        space = std::mem::size_of::<Maintainers>() + 32
    )]
    pub maintainers: Box<Account<'info, Maintainers>>,

    /// CHECK: Whitelist
    #[account(
        init,
        seeds = [WHITELIST_TAG],
        bump,
        payer = authority,
        space = std::mem::size_of::<WhitelistedUser>() + (whitelisted_users.len() * 32),
    )]
    pub whitelist: Box<Account<'info, WhitelistedUser>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token2022>,
}
