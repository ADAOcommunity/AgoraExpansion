use aiken/transaction/value.{AssetName, PolicyId}

pub type ConfigParameter {
  action: ActionConfig,
  power_list: List<PowerConfig>,
}

pub type ActionConfig {
  Sum
  Multiply
}

pub type PowerConfig {
  weight: Int,
  asset_config: AssetConfig,
}

pub type AssetConfig {
  AssetSelection { asset_selection: AssetSelection }
  QuadraticConfig { policy: PolicyId, asset: List<AssetSelection> }
}

pub type AssetSelection {
  PolicySelection { policy: PolicyId }
  AssetClass { policy: PolicyId, asset: AssetName }
  FilterConfig { policy: PolicyId, filter: TraitOption }
}

pub type TraitOption {
  Included(ByteArray)
  Excluded(ByteArray)
}

pub type ContractDatum {
  bond_name: ByteArray,
  voting_power: Int,
}

pub type Redeemer {
  Lock
  Unlock
}
