use super::*;

#[account]
pub struct Maintainers {
    /// Sub Admins
    pub sub_admins: Vec<Pubkey>,

    /// Admin
    pub admin: Pubkey,
}

impl Maintainers {
    pub fn add_admin(&mut self, admin: Pubkey) {
        self.admin = admin;
    }

    pub fn add_sub_admins(&mut self, sub_admins: Vec<Pubkey>) {
        self.sub_admins.extend(sub_admins);
        self.sub_admins.sort();
        self.sub_admins.dedup();
    }

    pub fn remove_sub_admins(&mut self, sub_admins: Vec<Pubkey>) {
        self.sub_admins.retain(|addr| !sub_admins.contains(addr));
    }

    pub fn save(&mut self, caller: Pubkey) {
        self.admin = caller;
        self.sub_admins = vec![caller];
    }
}
