use agora/types.{
  ConfigParameter, ContractDatum, Lock, Multiply, PowerConfig, Redeemer, Sum,
  Unlock,
}
use agora/utils.{
  gen_token_name, get_inline_data, get_power_for, governance_token_name,
}
use aiken/bytearray
use aiken/dict
use aiken/list
use aiken/transaction.{Input,
  Mint, Output, ScriptContext, Spend, Transaction} as tx
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value

/// This file contains a validator which can be used to lock NFT(s) as well as FT(s) as defined by the parameters.
/// By locking these tokens, the user is able to mint governance tokens which are used to vote on proposals.
/// At any time, the user may unlock their tokens and receive their original tokens back.
/// None of the contract relies on stake credentials, so the user stake credential can be used if desirable.
validator(config: ConfigParameter) {
  fn locker(datum: ContractDatum, _redeemer: Data, ctx: ScriptContext) {
    let ScriptContext { transaction, purpose } = ctx
    expect Spend(out) = purpose
    let Transaction { inputs, mint, .. } = transaction

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
    expect [_input] =
      list.filter(
        inputs,
        fn(input: Input) {
          input.output.address.payment_credential == i.output.address.payment_credential
        },
      )

    // Here we should get the amount of tokens to burn from the datum and ensure that the burn is what we would expect it to be.
    let tokens_to_burn =
      dict.insert(dict.new(), datum.bond_name, -2, bytearray.compare)
        |> dict.insert(
            governance_token_name(),
            -datum.voting_power,
            bytearray.compare,
          )
    let tokens_burned =
      value.tokens(value.from_minted_value(mint), policy_id) == tokens_to_burn
    tokens_burned?
  }

  fn minter(redeemer: Redeemer, ctx: ScriptContext) {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, mint, .. } = transaction
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
                      get_power_for(x, output.value) + y
                    },
                  )
                Multiply ->
                  list.foldr(
                    config.power_list,
                    0,
                    fn(x: PowerConfig, y: Int) {
                      get_power_for(x, output.value) * y
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
            // TODO
            // We actually need to ensure that there are no positive mints of our policy in the mint at all here.
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
