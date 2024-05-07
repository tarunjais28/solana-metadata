use super::*;

#[event]
pub struct InitEvent {
    pub admin: Pubkey,
    pub sub_admin: Pubkey,
}

#[event]
pub struct CreateTokenEvent {
    /// Token Name
    pub name: String,
}

#[event]
pub struct MintEvent {
    pub token: String,
    pub amount: u64,
}

#[event]
pub struct TransferEvent {
    pub token: String,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct InitResourcesEvent {
    pub token: String,
    pub escrow_account: Pubkey,
    pub vault_account: Pubkey,
}

#[event]
pub struct BurnEvent {
    pub token: String,
    pub amount: u64,
}
