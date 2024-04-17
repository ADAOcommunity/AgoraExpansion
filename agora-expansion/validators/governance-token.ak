use aiken/bytearray
use aiken/cbor
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
/// None of the contract relies on stake credentials, so the user stake credential can be used if desirable.
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
  Included(ByteArray)
  Excluded(ByteArray)
}

type ContractDatum {
  bond_name: ByteArray,
  voting_power: Int,
}

type Redeemer {
  Lock
  Unlock
}

// We only allow inline datums.
fn get_inline_data(datum: Datum) -> Data {
  when datum is {
    InlineDatum(d) -> d
    _ -> fail
  }
}

// Generate the token name for the receipt.
fn gen_token_name(output_reference: OutputReference) -> AssetName {
  blake2b_256(cbor.serialise(output_reference))
}

fn governance_token_name() -> AssetName {
  "voting_power"
}

// TODO
// We still need to fill out a lot of the logic.
fn get_power_for(
  power_config: PowerConfig,
  value: Value,
  reference_inputs: List<Input>,
) -> Int {
  when power_config.asset_config is {
    AssetSelection(asset_selection) ->
      when asset_selection is {
        // For policy we use tokens and fold over the resulting Dict.ToList
        // We get the value of each and add
        PolicyId(policy) -> 1
        // For asset class we simply look for the asset class amount and return it
        AssetClass(policy, name) -> 2
        // For filter, we must first look to tokens, 
        // We really need to specify the input asset for effectiveness no?
        FilterConfig(policy, filter) -> 3
      }
    // Here we will get the tokens of the value for the policy. We fold over the fungible list which is a list of AssetClass, we should ensure this.
    // Then we can basically just take the square root of the total of the fungible list, but only if the policy is satisfied.
    QuadraticConfig(policy, fungible_list) -> 4
  }
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

    // Get the input that is being validated.
    expect [i] =
      list.filter(inputs, fn(input: Input) { input.output_reference == out })
    // We know that the policy for voting power and receipts is the same as the payment credential because it's our script.
    let policy_id =
      when i.output.address.payment_credential is {
        ScriptCredential(policy_id) -> policy_id
        _ -> fail
      }
    // We get the input again, and ensure that it's the only one coming from our script.
    expect [input] =
      list.filter(
        inputs,
        fn(input: Input) {
          input.output.address.payment_credential == i.output.address.payment_credential
        },
      )

    // Here we should get the amount of tokens to burn from the datum and ensure that the burn is what we would expect it to be.
    // TODO
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
            // We ensure that there are no inputs from our locker.
            expect Some(input_for_name) = list.at(inputs, 0)
            expect
              list.all(
                inputs,
                fn(input: Input) {
                  input.output.address.payment_credential != ScriptCredential(
                    policy_id,
                  )
                },
              )
            // We ensure that there is a single output to our locker.
            expect [output] =
              list.filter(
                outputs,
                fn(output: Output) {
                  output.address.payment_credential == ScriptCredential(
                    policy_id,
                  )
                },
              )
            // Calculate voting power
            let v_power =
              when config.action is {
                Sum ->
                  list.foldr(
                    config.power_list,
                    0,
                    fn(x: PowerConfig, y: Int) {
                      get_power_for(x, output.value, reference_inputs) + y
                    },
                  )
                Multiply ->
                  list.foldr(
                    config.power_list,
                    0,
                    fn(x: PowerConfig, y: Int) {
                      get_power_for(x, output.value, reference_inputs) * y
                    },
                  )
              }

            // We ensure that the datum for our locker is correct.
            expect d: ContractDatum = get_inline_data(output.datum)
            expect
              d.bond_name == gen_token_name(input_for_name.output_reference)
            expect d.voting_power == v_power
            // Our output should have one of the two receipts as a beacon.
            expect value.quantity_of(output.value, policy_id, d.bond_name) == 1

            // We ensure that the voting power is minted properly.
            expect [(corrected_policy, corrected_token_map)] =
              value.from_asset(policy_id, governance_token_name(), v_power)
                |> value.add(policy_id, d.bond_name, 2)
                |> value.to_dict()
                |> dict.to_list()

            let correct_mint = and {
                corrected_policy == policy_id,
                value.tokens(value.from_minted_value(mint), policy_id) == corrected_token_map,
              }
            correct_mint?
          }
          Unlock -> {
            // TODO - We actually need to ensure that there are no positive mints of our policy in the mint at all here.
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
