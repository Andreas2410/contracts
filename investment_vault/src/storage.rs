use crate:::Types::VaultKey;
use soroban_sdk::{:Address, Env};

pub fn read_usdc_sac(env: &Env) -> Address {
    env.storage().instance().get(&VaultKey::UsdcSac).unwrap()
}

pub fn read_registry(env: &Env) -> Address {
    env.storage().instance().get(&VaultKey::Registry).unwrap()
}

pub fn bump_total_deposited_ttl(env: &Env, account: &Address) {
    env.storage().persistent().extend_ttl(&VaultKey::TotalDeposited(account.clone()), 17280, u32::MAX);
}