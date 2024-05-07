use super::*;

/// The struct containing instructions for creating tokens
#[account]
#[derive(Debug, Default)]
pub struct CreateTokenParams {
    /// Token Name
    pub name: String,

    /// Symbol
    pub symbol: String,

    /// URI
    pub uri: String,

    /// Decimals
    pub decimals: u8,
}

/// The struct containing instructions for mint and burn tokens
#[account]
#[derive(Debug, Default)]
pub struct TokenParams {
    /// Token Name
    pub name: String,

    /// Amount of tokens to be minted.
    pub amount: u64,
}

/// The struct containing instructions for transferring tokens
#[account]
#[derive(Debug, Default)]
pub struct TransferParams {
    /// Token Name
    pub token: String,

    /// To Token
    pub to_account: Pubkey,

    /// Amount of tokens to be transferred
    pub amount: u64,
}

/// The struct containing instructions for force transferring tokens
#[account]
#[derive(Debug, Default)]
pub struct ForceTransferParams {
    /// Token Name
    pub token: String,

    /// From Account
    pub from_account: Pubkey,

    /// To Account
    pub to_account: Pubkey,

    /// Amount of tokens to be transferred
    pub amount: u64,
}

/// The struct containing instructions for whitelisting
#[account]
#[derive(Debug, Default)]
pub struct WhitelistParams {
    /// Token Name
    pub token: String,

    /// User to be whitelisted
    pub user: Pubkey,
}

/// The struct containing instructions for transferring tokens
#[account]
#[derive(Debug, Default)]
pub struct BuyWithSolParams {
    /// Token Name
    pub token: String,

    /// Sol Amount
    pub sol_amount: u64,
}
