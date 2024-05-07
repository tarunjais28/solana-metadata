use super::*;

#[error_code]
pub enum CustomError {
    #[msg("Error: Your balance is not enough!")]
    InsufficientFunds,

    #[msg("Error: Amount can't be zero!")]
    AmountCantBeZero,

    #[msg("Error: Country_code authentication failed!")]
    CountryCodeAuthorizationFailed,

    #[msg("Error: Unauthorized User!")]
    Unauthorized,

    #[msg("Error: Token Limit exceeded!")]
    TokenLimitExceeded,

    #[msg("Error: Account is frozen!")]
    AccountFrozen,

    #[msg("Error: Balance is frozen!")]
    BalanceFrozen,
}
