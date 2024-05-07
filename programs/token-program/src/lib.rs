use crate::{constants::*, errors::*, events::*, instructions::*, states::*, structs::*};
use anchor_lang::{
    prelude::*,
    solana_program::entrypoint::ProgramResult,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Burn, MintTo, Token2022},
    token_interface::{
        token_metadata_initialize, Mint, TokenAccount, TokenMetadataInitialize,
    },
};
pub use structs::TokenParams;

mod constants;
mod enums;
mod errors;
mod events;
mod instructions;
mod states;
mod structs;

declare_id!("D5W4yH27EwaATTYjaLLidx6sLRJ9AsXH6kZCSGvoritn");

#[program]
pub mod token_program {
    use super::*;

    pub fn init(ctx: Context<Initialize>, whitelisted_users: Vec<Pubkey>) -> Result<()> {
        instructions::initialize(ctx, whitelisted_users)
    }

    pub fn create(ctx: Context<CreateToken>, params: CreateTokenParams) -> Result<()> {
        instructions::create_token(ctx, params)
    }

    pub fn mint_token(ctx: Context<MintToken>, params: TokenParams) -> Result<()> {
        instructions::mint(ctx, params)
    }

    pub fn burn_token(ctx: Context<BurnToken>, params: TokenParams) -> Result<()> {
        instructions::burn(ctx, params)
    }

    pub fn burn_token_from(ctx: Context<BurnTokenFrom>, params: TokenParams) -> Result<()> {
        instructions::burn_from(ctx, params)
    }
}
