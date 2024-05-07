use super::*;

/// Function to mint the tokens
///
/// This function can throw following errors:
///   - Amount Can't Be Zero (when user passes 0 amount for mint).
pub fn mint(ctx: Context<MintToken>, params: TokenParams) -> Result<()> {
    let sub_admins = &ctx.accounts.maintainers.sub_admins;
    let caller = ctx.accounts.authority.to_account_info().key();

    // Ensuring authorized sender
    require!(sub_admins.contains(&caller), CustomError::Unauthorized);

    // Check user balance first
    require!(params.amount > 0, CustomError::AmountCantBeZero);

    let seeds = &[MINT_TAG, params.name.as_bytes(), &[ctx.bumps.mint_account]];
    let signer = [&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();

    // Create the MintTo struct for our context
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint_account.to_account_info(),
        to: ctx.accounts.to_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    token_2022::mint_to(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer),
        params.amount,
    )?;

    // Emit mint event
    emit!(MintEvent {
        token: params.name,
        amount: params.amount
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: TokenParams)]
pub struct MintToken<'info> {
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

    /// CHECK: This is the token account that we want to mint tokens to (ATA)
    #[account(mut)]
    pub to_account: AccountInfo<'info>,

    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}
