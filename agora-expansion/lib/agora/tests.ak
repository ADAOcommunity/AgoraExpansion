use agora/types.{
  AssetClass, AssetConfig, AssetSelection, PolicySelection, PowerConfig,
}
use agora/utils.{get_power_for}
use aiken/transaction/value.{Value, from_asset, merge}

fn asset_config_1() -> AssetConfig {
  AssetSelection { asset_selection: PolicySelection { policy: #"deadbeef" } }
}

fn asset_config_2() -> AssetConfig {
  AssetSelection {
    asset_selection: AssetClass { policy: #"dead", asset: #"beef" },
  }
}

fn power_config_1() -> PowerConfig {
  let asset_config_1 = asset_config_1()
  let x: PowerConfig = PowerConfig { weight: 1, asset_config: asset_config_1 }
  x
}

fn power_config_2() -> PowerConfig {
  let asset_config_2 = asset_config_2()
  let x: PowerConfig = PowerConfig { weight: 1, asset_config: asset_config_2 }
  x
}

fn value_1() -> Value {
  from_asset(#"deadbeef", #"beef", 1)
}

fn value_2() -> Value {
  let v1 = from_asset(#"deadbeef", #"", 1)
  let v2 = from_asset(#"deadbeef", #"beef", 1)
  merge(v1, v2)
}

fn value_3() -> Value {
  let v1 = value_1()
  let v2 = value_2()
  merge(v1, v2)
}

test sanity_test() {
  1 == 1
}

test get_power_for_1() {
  let power_config = power_config_1()
  let value = value_1()
  let power = get_power_for(power_config, value)
  power == 1
}

test get_power_for_2() {
  let power_config = power_config_1()
  let value = value_2()
  let power = get_power_for(power_config, value)
  power == 2
}

test get_power_for_3() {
  let power_config = power_config_1()
  let value = value_3()
  let power = get_power_for(power_config, value)
  power == 3
}

test get_power_for_4() {
  let power_config = power_config_2()
  let value = value_1()
  let power = get_power_for(power_config, value)
  power == 0
}

test get_power_for_5() {
  let power_config = power_config_2()
  let value = value_2()
  let power = get_power_for(power_config, value)
  power == 0
}

test get_power_for_6() {
  let power_config = power_config_2()
  let value = value_3()
  let power = get_power_for(power_config, value)
  power == 0
}
