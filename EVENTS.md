# Heliobond Events Catalog

This document provides a catalog of all events emitted by the Heliobond smart contracts for off-chain indexers and developers.

Each event lists the public [`INTERFACE.md`](INTERFACE.md) function(s) that emit it, so indexer authors can trace an event back to the call that produced it.

## Project Registry Events

### `project_created`
- **Topics**: `["project", "created"]`
- **Data**: `(project_id: u32, creator: Address)`
- **Description**: Emitted when a new project is created in the registry.
- **Emitted by**: [`create_project`](INTERFACE.md#projectregistry)

### `score_changed`
- **Topics**: `["score_changed", project_id: u32]`
- **Data** (Map, keyed by field name): `{old_credit_quality: u32, new_credit_quality: u32, old_green_impact: u32, new_green_impact: u32, old_rate_bps: u32, new_rate_bps: u32}`
- **Description**: Emitted when a project's impact scores and corresponding interest rate are updated.
- **Emitted by**: [`update_impact_score`](INTERFACE.md#projectregistry) / [`update_impact_score_approved`](INTERFACE.md#projectregistry) (both scores), [`update_credit_quality_score`](INTERFACE.md#projectregistry) (credit quality only)

### `project_archived`
- **Topics**: `["project", "archived"]`
- **Data**: `(project_id: u32)`
- **Description**: Emitted when a project is archived.
- **Emitted by**: [`archive_project`](INTERFACE.md#projectregistry)

### `project_deleted`
- **Topics**: `["project", "deleted"]`
- **Data**: `(project_id: u32)`
- **Description**: Emitted when a project is completely deleted.
- **Emitted by**: [`delete_project`](INTERFACE.md#projectregistry)

### `project_compacted`
- **Topics**: `["project", "compacted"]`
- **Data**: `(project_id: u32)`
- **Description**: Emitted when a project's storage footprint is reduced.
- **Emitted by**: [`compact_archive`](INTERFACE.md#projectregistry)

### `collateral_deposited`
- **Topics**: `["project", "collateral_deposited"]`
- **Data**: `(project_id: u32, token: Address, depositor: Address, amount: i128)`
- **Description**: Emitted when collateral is added for a project.
- **Emitted by**: [`deposit_collateral`](INTERFACE.md#projectregistry)

### `collateral_released`
- **Topics**: `["project", "collateral_released"]`
- **Data**: `(project_id: u32, token: Address, receiver: Address, amount: i128)`
- **Description**: Emitted when collateral is returned to the project owner.
- **Emitted by**: [`release_collateral`](INTERFACE.md#projectregistry)

## Investment Vault Events

### `deposit`
- **Topics**: `["vault", "deposit"]`
- **Data**: `(from: Address, usdc_amount: i128, shares_minted: i128)`
- **Description**: Emitted when an investor deposits USDC and receives newly minted vault shares.
- **Emitted by**: [`deposit`](INTERFACE.md#investmentvault)

### `withdraw`
- **Topics**: `["vault", "withdraw"]`
- **Data**: `(from: Address, shares_burned: i128, usdc_returned: i128)`
- **Description**: Emitted when an investor burns shares and receives USDC immediately (sufficient liquid USDC was available). See `withdraw_queued` for the insufficient-liquidity path.
- **Emitted by**: [`withdraw`](INTERFACE.md#investmentvault)

### `withdraw_queued`
- **Topics**: `["vault", "withdraw_queued"]`
- **Data**: `(from: Address, shares_burned: i128, usdc_owed: i128)`
- **Description**: Emitted when `withdraw` can't pay out immediately because liquid USDC is insufficient. Shares are burned right away and the USDC payout is enqueued in FIFO order; call `claim()` once liquidity is restored.
- **Emitted by**: [`withdraw`](INTERFACE.md#investmentvault)

### `withdraw_claimed`
- **Topics**: `["vault", "withdraw_claimed"]`
- **Data**: `(to: Address, usdc_paid: i128, claim_index: u64)`
- **Description**: Emitted when a previously queued redemption (see `withdraw_queued`) is settled.
- **Emitted by**: [`claim`](INTERFACE.md#investmentvault)

### `paused`
- **Topics**: `["vault", "paused"]`
- **Data**: — (no fields)
- **Description**: Emitted when the vault's circuit breaker is engaged, blocking all state-mutating user operations.
- **Emitted by**: [`pause`](INTERFACE.md#investmentvault), [`emergency_pause`](INTERFACE.md#investmentvault)

### `unpaused`
- **Topics**: `["vault", "unpaused"]`
- **Data**: — (no fields)
- **Description**: Emitted when the vault's circuit breaker is disengaged, resuming normal operation.
- **Emitted by**: [`unpause`](INTERFACE.md#investmentvault), [`emergency_unpause`](INTERFACE.md#investmentvault)

### `emergency_admin_changed`
- **Topics**: `["vault", "emergency_admin_changed"]`
- **Data**: `(new_emergency_admin: Option<Address>)`
- **Description**: Emitted when the admin sets or clears the address authorised to pause/unpause the vault in an emergency without going through the owner.
- **Emitted by**: [`set_emergency_admin`](INTERFACE.md#investmentvault)

### `project_funded`
- **Topics**: `["vault", "project_funded"]`
- **Data**: `(project_id: u32, amount: i128, recipient: Address)`
- **Description**: Emitted when the vault transfers USDC from the vault to a project's owner.
- **Emitted by**: [`fund_project`](INTERFACE.md#investmentvault), [`fund_project_with_approvals`](INTERFACE.md#investmentvault), [`batch_fund_projects`](INTERFACE.md#investmentvault)

### `yield_received`
- **Topics**: `["vault", "yield_received"]`
- **Data**: `(from: Address, amount: i128)`
- **Description**: Emitted when yield repayment USDC is received from a project and folded into the yield-per-share accumulator for later claims.
- **Emitted by**: [`receive_yield`](INTERFACE.md#investmentvault)

### `yield_claimed`
- **Topics**: `["vault", "yield_claimed"]`
- **Data**: `(to: Address, amount: i128)`
- **Description**: Emitted when a shareholder claims accumulated yield, transferring USDC out of the vault to `to`.
- **Emitted by**: [`claim_yield`](INTERFACE.md#investmentvault)

### `insurance_claimed`
- **Topics**: `["vault", "insurance_claimed"]`
- **Data**: `(project_id: u32, recipient: Address, amount: i128)`
- **Description**: Emitted when an insurance payout is made for a defaulted project, transferring USDC out of the vault to `recipient`.
- **Emitted by**: [`claim_insurance`](INTERFACE.md#investmentvault), [`claim_insurance_with_approvals`](INTERFACE.md#investmentvault)

### `bridge_transfer_initiated`
- **Topics**: `["vault", "bridge_transfer_initiated"]`
- **Data**: `(from: Address, amount: i128, target_chain: u32, recipient: BytesN<32>, sequence: u64)`
- **Description**: Emitted when an outbound Wormhole cross-chain bridge transfer is initiated: shares are burned from `from` and a message is queued for the target chain.
- **Emitted by**: [`initiate_bridge_transfer`](INTERFACE.md#investmentvault)

### `bridge_transfer_completed`
- **Topics**: `["vault", "bridge_transfer_completed"]`
- **Data**: `(source_chain: u32, emitter: BytesN<32>, to: Address, amount: i128)`
- **Description**: Emitted when an inbound Wormhole VAA is verified and its transfer completed, minting shares to `to`.
- **Emitted by**: [`complete_bridge_transfer`](INTERFACE.md#investmentvault)

### `trusted_emitter_set`
- **Topics**: `["vault", "trusted_emitter_set"]`
- **Data**: `(chain_id: u32, emitter: BytesN<32>, trusted: bool)`
- **Description**: Emitted when a cross-chain emitter address is registered or unregistered as trusted for a given source chain, gating which inbound VAAs `complete_bridge_transfer` will accept.
- **Emitted by**: [`set_trusted_emitter`](INTERFACE.md#investmentvault)

### `flash_loan`
- **Topics**: `["vault", "flash_loan"]`
- **Data**: `(initiator: Address, borrower: Address, amount: i128, fee: i128)`
- **Description**: Emitted when a flash loan is drawn and successfully repaid (principal plus fee) within the same transaction.
- **Emitted by**: [`execute_flash_loan`](INTERFACE.md#investmentvault)

### `flash_loan_fee_set`
- **Topics**: `["vault", "flash_loan_fee_set"]`
- **Data**: `(fee_bps: i128)`
- **Description**: Emitted when the flash loan fee, in basis points, is updated.
- **Emitted by**: [`set_flash_loan_fee`](INTERFACE.md#investmentvault)

### `carbon_oracle_set`
- **Topics**: `["vault", "carbon_oracle_set"]`
- **Data**: `(oracle: Address)`
- **Description**: Emitted when the carbon credit price oracle address is configured.
- **Emitted by**: [`set_carbon_oracle`](INTERFACE.md#investmentvault)

### `carbon_credit_price_set`
- **Topics**: `["vault", "carbon_credit_price_set"]`
- **Data**: `(price: i128)`
- **Description**: Emitted when the carbon credit price is updated.
- **Emitted by**: [`set_carbon_credit_price`](INTERFACE.md#investmentvault)

### `carbon_credits_calculated`
- **Topics**: `["vault", "carbon_credits_calculated"]`
- **Data**: `(project_id: u32, amount_invested: i128, credits: i128)`
- **Description**: Emitted when carbon credits are calculated and issued for an investment in a project.
- **Emitted by**: [`calculate_carbon_credits`](INTERFACE.md#investmentvault)

### `carbon_credits_transferred`
- **Topics**: `["vault", "carbon_credits_transferred"]`
- **Data**: `(from: Address, to: Address, amount: i128)`
- **Description**: Emitted when carbon credits are transferred between accounts.
- **Emitted by**: [`transfer_carbon_credits`](INTERFACE.md#investmentvault)

### `compliance_event_recorded`
- **Topics**: `["vault", "compliance_event_recorded"]`
- **Data**: `(seq: u64, event_type: String)`
- **Description**: Emitted when a compliance event is recorded to the on-chain audit trail for regulatory reporting.
- **Emitted by**: [`record_compliance_event`](INTERFACE.md#investmentvault)

### `reporting_snapshot_taken`
- **Topics**: `["vault", "reporting_snapshot_taken"]`
- **Data**: `(timestamp: u64)`
- **Description**: Emitted when a periodic snapshot of the vault's key metrics is taken for regulatory reporting.
- **Emitted by**: [`take_reporting_snapshot`](INTERFACE.md#investmentvault)

### `max_transaction_amount_set`
- **Topics**: `["vault", "max_transaction_amount_set"]`
- **Data**: `(amount: i128)`
- **Description**: Emitted when the maximum single-transaction amount compliance limit is updated.
- **Emitted by**: [`set_max_transaction_amount`](INTERFACE.md#investmentvault)

### `management_fee_set`
- **Topics**: `["vault", "management_fee_set"]`
- **Data**: `(recipient: Address, fee_bps: u32)`
- **Description**: Emitted when the admin updates the management fee configuration.
- **Emitted by**: [`set_management_fee`](INTERFACE.md#investmentvault)

### `trading_enabled`
- **Topics**: `["vault", "trading_enabled"]`
- **Data**: `(enabled: bool)`
- **Description**: Emitted when the admin enables secondary market trading for HBS shares.
- **Emitted by**: [`enable_secondary_trading`](INTERFACE.md#investmentvault)

### `funding_thresholds_set`
- **Topics**: `["vault", "funding_thresholds_set"]`
- **Data**: `(min_credit_quality: u32, min_green_impact: u32)`
- **Description**: Emitted when the admin updates the minimum funding score thresholds.
- **Emitted by**: [`set_funding_thresholds`](INTERFACE.md#investmentvault)

### `registry_changed`
- **Topics**: `["vault", "registry_changed"]`
- **Data**: `(old_registry: Address, new_registry: Address)`
- **Description**: Emitted when the admin replaces the linked ProjectRegistry contract.
- **Emitted by**: [`set_registry`](INTERFACE.md#investmentvault)

### `utilization_warning`
- **Topics**: `["vault", "utilization_warning"]`
- **Data**: `(utilization_bps: u32)`
- **Description**: Emitted during `withdraw()` whenever vault utilization crosses the high-utilization threshold (`UTIL_WARN_BPS`, 70%). Off-chain monitors should alert operators to consider replenishing liquidity.
- **Emitted by**: [`withdraw`](INTERFACE.md#investmentvault)

### `bridge_set`
- **Topics**: `["vault", "bridge_set"]`
- **Data**: `(bridge: Address)`
- **Description**: Emitted when the admin configures the direct (non-Wormhole) bridge address authorised to mint/burn vault shares.
- **Emitted by**: [`set_bridge`](INTERFACE.md#investmentvault)

### `bridge_mint`
- **Topics**: `["vault", "bridge_mint"]`
- **Data**: `(to: Address, amount: i128)`
- **Description**: Emitted when the configured direct bridge mints shares to `to` for an inbound cross-chain transfer.
- **Emitted by**: [`bridge_mint`](INTERFACE.md#investmentvault)

### `bridge_burn`
- **Topics**: `["vault", "bridge_burn"]`
- **Data**: `(from: Address, amount: i128)`
- **Description**: Emitted when the configured direct bridge burns shares from `from` for an outbound cross-chain transfer.
- **Emitted by**: [`bridge_burn`](INTERFACE.md#investmentvault)
