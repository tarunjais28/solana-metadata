use super::*;

/// Function to burn the tokens fom
///
/// This function can throw following errors:
///   - Amount Can't Be Zero (when user passes 0 amount for burn).
pub fn burn_from(ctx: Context<BurnTokenFrom>, params: TokenParams) -> Result<()> {
    let sub_admins = &ctx.accounts.maintainers.sub_admins;
    let caller = ctx.accounts.authority.to_account_info().key();

    // Ensuring authorized sender
    require!(sub_admins.contains(&caller), CustomError::Unauthorized);

    // Check amount first
    require!(params.amount > 0, CustomError::AmountCantBeZero);

    let seeds = &[MINT_TAG, params.name.as_bytes(), &[ctx.bumps.mint_account]];
    let signer = [&seeds[..]];

    let cpi_program = ctx.accounts.token_program.to_account_info();

    // Create the MintTo struct for our context
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint_account.to_account_info(),
        from: ctx.accounts.from.to_account_info(),
        authority: ctx.accounts.mint_account.to_account_info(),
    };
    token_2022::burn(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer),
        params.amount,
    )?;

    // Emit burn event
    emit!(BurnEvent {
        token: params.name,
        amount: params.amount
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: TokenParams)]
pub struct BurnTokenFrom<'info> {
    #[account(
        seeds = [MAINTAINERS_TAG],
        bump,
    )]
    pub maintainers: Box<Account<'info, Maintainers>>,

    /// CHECK: This is the token that we want to mint
    #[account(
        mut,
        seeds = [MINT_TAG, params.name.as_bytes()],
        bump,
    )]
    pub mint_account: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: This is the token account that we want to burn tokens from
    #[account(mut)]
    pub from: AccountInfo<'info>,

    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,

    pub system_program: Program<'info, System>,
}
