use crate::Types::VaultKey;
use soroban_sdk:{Address, Env};

pub fn read_usdc_sac(env: &Env) -> Address {
    env.storage().instance().get(&VaultKey::UsdcSac).unwrap()
}

pub fn read_registry(env: &Env) -> Address {
    env.storage().instance().get(&VaultKey::Registry).unwrap()
}

pub fn bump_total_deposited_ttl(env: &Env, account: &Address) {
    env.storage().persistent().extend_ttl(&VaultKey::TotalDeposited(account.clone()), 17280, u32::MAX);
}

#c[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk:{Env, Address, testutils::Address as _};

    #[test]
    fn test_total_deposited_ttl_extended_to_max() {
        let env = Env::default();
        let account = Address::generate(&env);
        let key = VaultKey::TotalDeposited(account.clone());
        env.storage().persistent().set(&key, &123i128);
        bump_total_deposited_ttl(&env, &account);
        let current = env.ledger().sequence();
        env.ledger().with_mutable(|li| li.sequence = current + 600_000);
        let value: i128 = env.storage().persistent().get(&key).unwap();
        assert_eq(!value, 123);
    }
}