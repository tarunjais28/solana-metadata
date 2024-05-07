use super::*;

#[account]
#[derive(Default)]
pub struct WhitelistedUser {
    pub users: Vec<Pubkey>,
}

impl WhitelistedUser {
    pub fn save(&mut self, users: Vec<Pubkey>) {
        self.users = users
    }

    pub fn add_users(&mut self, users: Vec<Pubkey>) {
        self.users.extend(users);
        self.users.sort();
        self.users.dedup();
    }

    pub fn remove_users(&mut self, users: Vec<Pubkey>) {
        self.users.retain(|user| !users.contains(user));
    }
}
