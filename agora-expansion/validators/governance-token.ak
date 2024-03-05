use aiken/bytearray
use aiken/dict
use aiken/hash.{Blake2b_224, Hash, blake2b_256}
use aiken/list
use aiken/string
use aiken/transaction.{
  Datum, InlineDatum, Input, Mint, Output, OutputReference, ScriptContext, Spend,
  Transaction, ValidityRange, WithdrawFrom,
} as tx
use aiken/transaction/credential.{
  Address, Credential, Inline, Script, ScriptCredential, StakeCredential,
  VerificationKey, VerificationKeyCredential,
}
use aiken/transaction/value.{AssetName, PolicyId, Value}

/// This file contains a validator which can be used to lock NFT(s) as well as FT(s) as defined by the parameters.
/// By locking these tokens, the user is able to mint governance tokens which are used to vote on proposals.
/// At any time, the user may unlock their tokens and receive their original tokens back.
type ConfigParameter {
  action: ActionConfig,
  power_list: List<PowerConfig>,
}

type ActionConfig {
  Sum
  Multiply
}

type PowerConfig {
  weight: Int,
  asset_config: AssetConfig,
}

type AssetConfig {
  AssetSelection { asset_selection: AssetSelection }
  QuadraticConfig { policy: PolicyId, asset: List<AssetSelection> }
}

type AssetSelection {
  PolicyId { policy: PolicyId }
  AssetClass { policy: PolicyId, asset: AssetName }
  FilterConfig { policy: PolicyId, filter: TraitOption }
}

type TraitOption {
  Included
  Excluded
}

type ContractDatum {
  bond_name: ByteArray,
  voting_power: Int,
}

type Redeemer {
  Lock
  Unlock
}

// Generate the token name for the receipt.
fn gen_token_name(
  hash: ByteArray,
  original_index: Int,
  mint_index: Int,
) -> AssetName {
  blake2b_256(
    bytearray.concat(
      bytearray.concat(
        hash,
        string.to_bytearray(string.from_int(original_index)),
      ),
      string.to_bytearray(string.from_int(mint_index)),
    ),
  )
}

fn governance_token_name() -> AssetName {
  "voting_power"
}

fn get_power_for(
  power_list: List<PowerConfig>,
  asset: (ByteArray, ByteArray, Int),
) -> Int {
  list.foldr(
    power_list,
    0,
    fn(x: PowerConfig, y: Int) {
      when x.asset_config is {
        AssetSelection(a) ->
          when a is {
            PolicyId(policy) ->
              when asset is {
                (policy_id, _, multiplier) ->
                  if policy == policy_id {
                    y + x.weight * multiplier
                  } else {
                    y
                  }
              }
            AssetClass(policy, name) ->
              when asset is {
                (policy_id, asset_name, multiplier) ->
                  if policy == policy_id && name == asset_name {
                    y + x.weight * multiplier
                  } else {
                    y
                  }
              }
            _ -> y
          }
        _ -> y
      }
    },
  )
  // let AssetConfig { weight, assetConfig } = x
  // let (policy_id, asset_name, quantity) = asset
  // let weight_for_asset =
  // when assetConfig is {
  // AssetSelection -> weight
  // QuadraticConfig { policy, asset } ->
  // let AssetSelection { policy: p, asset: a } = asset
  // let FilterConfig { policy: p2, filter } = a
  // let policy_matches = policy == p
  // let asset_matches = asset_name == a
  // let filter_matches =
  // when filter is {
  // Included -> True
  // Excluded -> False
  // }
  // policy_matches && asset_matches && filter_matches
  // }
  // weight_for_asset * quantity
}

validator(config: ConfigParameter) {
  fn locker(datum: ContractDatum, _redeemer: Data, ctx: ScriptContext) {
    let ScriptContext { transaction, purpose } = ctx
    expect Spend(out) = purpose
    let Transaction {
      inputs,
      outputs,
      mint,
      reference_inputs,
      withdrawals,
      extra_signatories,
      ..
    } = transaction
    expect [i] =
      list.filter(inputs, fn(input: Input) { input.output_reference == out })
    let policy_id =
      when i.output.address.payment_credential is {
        ScriptCredential(policy_id) -> policy_id
        _ -> fail
      }
    expect [input] =
      list.filter(
        inputs,
        fn(input: Input) {
          input.output.address.payment_credential == i.output.address.payment_credential
        },
      )
    let tokens_burned =
      value.quantity_of(
        value.from_minted_value(mint),
        policy_id,
        governance_token_name(),
      ) < 0
    tokens_burned?
  }

  fn minter(redeemer: Redeemer, ctx: ScriptContext) {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction {
      inputs,
      outputs,
      mint,
      reference_inputs,
      withdrawals,
      extra_signatories,
      ..
    } = transaction
    when purpose is {
      Mint(policy_id) ->
        when redeemer is {
          Lock -> {
            // We ensure that there is a single output to our locker.
            // We ensure that there is are no inputs from our locker.
            // We calculate the voting power based on the single output to our locker.
            // We ensure that the voting power is minted properly.
            // We ensure that the datum for our locker is correct.
            expect
              list.all(
                inputs,
                fn(input: Input) {
                  input.output.address.payment_credential != ScriptCredential(
                    policy_id,
                  )
                },
              )
            expect Some(first_input) = list.at(inputs, 0)
            // find our single output.
            expect [output] =
              list.filter(
                outputs,
                fn(output: Output) {
                  output.address.payment_credential == ScriptCredential(
                    policy_id,
                  )
                },
              )
            let a_list = value.flatten(output.value)
            // Calculate voting power
            let v_power =
              when config.action is {
                Sum ->
                  list.foldr(
                    a_list,
                    0,
                    fn(x: (ByteArray, ByteArray, Int), y: Int) {
                      get_power_for(config.power_list, x) + y
                    },
                  )
                Multiply ->
                  list.foldr(
                    a_list,
                    1,
                    fn(x: (ByteArray, ByteArray, Int), y: Int) {
                      get_power_for(config.power_list, x) * y
                    },
                  )
              }
            expect [(corrected_policy, corrected_token_map)] =
              value.from_asset(policy_id, governance_token_name(), v_power)
                |> value.to_dict()
                |> dict.to_list()
            let correct_mint = and {
                corrected_policy == policy_id,
                value.tokens(value.from_minted_value(mint), policy_id) == corrected_token_map,
              }
            correct_mint?
          }
          Unlock -> {
            let tokens_burned =
              value.quantity_of(
                value.from_minted_value(mint),
                policy_id,
                governance_token_name(),
              ) < 0
            tokens_burned?
          }
        }

      _ -> False
    }
  }
}
