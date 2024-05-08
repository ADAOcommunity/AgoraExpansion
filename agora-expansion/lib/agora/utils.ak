use agora/types.{
  AssetClass, AssetSelection, FilterConfig, PolicySelection, PowerConfig,
  QuadraticConfig,
}
use aiken/cbor
use aiken/dict
use aiken/hash.{blake2b_256}
use aiken/list
use aiken/transaction.{Datum, InlineDatum, OutputReference} as tx
use aiken/transaction/value.{AssetName, Value, tokens}

// We only allow inline datums.
pub fn get_inline_data(datum: Datum) -> Data {
  trace @"get_inline_datum"
  trace cbor.diagnostic(datum)
  when datum is {
    InlineDatum(d) -> d
    _ -> fail
  }
}

// Generate the token name for the receipt.
pub fn gen_token_name(output_reference: OutputReference) -> AssetName {
  let serialised = cbor.serialise(output_reference)
  trace cbor.diagnostic(serialised)
  blake2b_256(serialised)
}

pub fn governance_token_name() -> AssetName {
  "voting_power"
}

pub fn get_power_for(power_config: PowerConfig, value: Value) -> Int {
  when power_config.asset_config is {
    AssetSelection(asset_selection) ->
      when asset_selection is {
        // For policy we use tokens and fold over the resulting Dict.ToList
        // We get the value of each and add
        PolicySelection(policy) ->
          list.foldr(
            tokens(value, policy) |> dict.to_list(),
            0,
            fn(x, y: Int) {
              let (_, amount) = x
              amount + y
            },
          )
        // For asset class we simply look for the asset class amount and return it
        AssetClass(policy, name) -> value.quantity_of(value, policy, name)
        // For filter, we must first look to tokens, 
        // We really need to specify the input asset for effectiveness no?
        // Future Feature, error for now.
        FilterConfig(_policy, _filter) -> fail
      }
    // Here we will get the tokens of the value for the policy. We fold over the fungible list which is a list of AssetClass, we should ensure this.
    // Then we can basically just take the square root of the total of the fungible list, but only if the policy is satisfied.
    // Future Feature, error for now.
    QuadraticConfig(_policy, _fungible_list) -> fail
  }
}
