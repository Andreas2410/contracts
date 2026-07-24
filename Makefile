.PHONY: build test check-interface-docs deploy-testnet

build:
	stellar contract build

test:
	cargo test

check-interface-docs:
	python3 scripts/check_interface_docs.py

deploy-testnet: build
	@mkdir -p deploy
	@REGISTRY_ID=$$(stellar contract deploy \
	  --wasm target/wasm32v1-none/release/project_registry.wasm \
	  --source $(STELLAR_SECRET_KEY) \
	  --network testnet \
	  -- \
	  --admin $(ADMIN_ADDRESS) \
	  --whitelister $(WHITELISTER_ADDRESS)) && \
	echo "ProjectRegistry: $$REGISTRY_ID" && \
	VAULT_ID=$$(stellar contract deploy \
	  --wasm target/wasm32v1-none/release/investment_vault.wasm \
	  --source $(STELLAR_SECRET_KEY) \
	  --network testnet \
	  -- \
	  --admin $(ADMIN_ADDRESS) \
	  --usdc_sac $(USDC_SAC_ADDRESS) \
	  --registry $$REGISTRY_ID) && \
	echo "InvestmentVault: $$VAULT_ID" && \
	printf '{"network":"testnet","project_registry":"%s","investment_vault":"%s"}\n' \
	  "$$REGISTRY_ID" "$$VAULT_ID" > deploy/testnet.json && \
	echo "Saved to deploy/testnet.json"
