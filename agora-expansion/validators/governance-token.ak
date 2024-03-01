use aiken/transaction/value.{AssetName, PolicyId, Value}

/// This file contains a validator which can be used to lock NFT(s) as well as FT(s) as defined by the parameters.
/// By locking these tokens, the user is able to mint governance tokens which are used to vote on proposals.
/// At any time, the user may unlock their tokens and receive their original tokens back.
type ConfigParameter {
  action: ActionConfig,
  powerList: List<PowerConfig>,
}

type ActionConfig {
  Sum
  Multiply
}

type PowerConfig {
  weight: Int,
  assetConfig: AssetConfig,
}

type AssetConfig {
  AssetSelection
  QuadraticConfig
}

type QuadraticConfig {
  policy: CurrencySymbol,
  asset: List<AssetClass>,
}

type AssetSelection {
  PolicyId
  AssetClass
  FilterConfig
}

type FilterConfig {
  policy: CurrencySymbol,
  filter: TraitOption,
}

type TraitOption {
  Included
  Excluded
}

type AssetClass {
  policy: CurrencySymbol,
  asset: AssetName,
}

type Datum {
  beacon_policy: ByteString,
  bond_name: ByteString,
  voting_power: Integer,
}

type Redeemer =
  Integer

validator {
  fn locker(redeemer: Redeemer, datum: Datum, ctx: ScriptContext) {
    todo
  }

  fn minter(redeemer: Redeemer, ctx: ScriptContext) {
    todo
  }
}
