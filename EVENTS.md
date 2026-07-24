# Heliobond Events Catalog

This document provides a catalog of all events emitted by the Heliobond smart contracts for off-chain indexers and developers.

## Project Registry Events

### `project_created`
- **Topics**: `["project", "created"]`
- **Data**: `(project_id: u32, creator: Address)`
- **Description**: Emitted when a new project is created in the registry.

### `score_changed`
- **Topics**: `["project", "score_changed"]`
- **Data**: `(project_id: u32, old_credit: u32, new_credit: u32, old_green: u32, new_green: u32, old_rate: u32, new_rate: u32)`
- **Description**: Emitted when a project's impact scores and corresponding interest rate are updated.

### `project_archived`
- **Topics**: `["project", "archived"]`
- **Data**: `(project_id: u32)`
- **Description**: Emitted when a project is archived.

### `project_deleted`
- **Topics**: `["project", "deleted"]`
- **Data**: `(project_id: u32)`
- **Description**: Emitted when a project is completely deleted.

### `project_compacted`
- **Topics**: `["project", "compacted"]`
- **Data**: `(project_id: u32)`
- **Description**: Emitted when a project's storage footprint is reduced.

### `collateral_deposited`
- **Topics**: `["project", "collateral_deposited"]`
- **Data**: `(project_id: u32, token: Address, depositor: Address, amount: i128)`
- **Description**: Emitted when collateral is added for a project.

### `collateral_released`
- **Topics**: `["project", "collateral_released"]`
- **Data**: `(project_id: u32, token: Address, receiver: Address, amount: i128)`
- **Description**: Emitted when collateral is returned to the project owner.

## Investment Vault Events

### `investment_made`
- **Topics**: `["vault", "investment"]`
- **Data**: `(project_id: u32, investor: Address, amount: i128)`
- **Description**: Emitted when a user invests in a project.

### `yield_distributed`
- **Topics**: `["vault", "yield_distributed"]`
- **Data**: `(project_id: u32, total_yield: i128)`
- **Description**: Emitted when yield is paid out to a project's investors.
