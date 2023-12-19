# Technical Specification: Agora Suite Expansion - NFT Standards and Novel Token Structures Integration

## I. Introduction
In our Research Document, we outlined the following potential approaches to allowing for NFTs to be used with Agora.
1. Stake Voting Power upon Calculation (Control via NFT lock validator)
2. Stake Voting Power upon Calculation (Control via separate validator)
3. Calculate Voting Power separate to Staking Voting power

We have decided that Calculation of Voting Power separate to Staking is the solution we will move forward with.

## II. Rationale
While Agora does support interoperability, the design pattern is already outdated due to Agora on-chain being developed throughout 2022 and early 2023.

In order to allow for interaction with an Agora stake UTxO owned by a validator, a UTxO must be spent from that validator in the same Tx where we are also requiring validators from Agora's core to run. This introduces overhead, attack surfaces, and a large amount of complexity. This is further complicated considering that voting power must also be burned when it is unstaked in order for methods 1 or 2 to be viable.

The primary disadvantage of method 3 is that it requires additional education for users of the system, they will have a bond which much be used in tandem with their voting power tokens in order to get their NFTs back. Method 3 is undisputably the most efficient (in terms of computation and memory usage) way to allow interaction with Agora by NFT communities.

## III. Implementation Logic
As stated in the research document, in order to adequately accomodate both CIP-25 and CIP-68 NFTs, while also allowing for more novel governance, we need to accomplish the following.
1. Incorporation of CIP-25 and CIP-68
2. Incorporation of CIP-68 Capabilities
3. Incorporation of Combining Policies

### Parameterization
In order to do this, we introduce a parameter which defines the calculation strategy for voting power. The parameter `ConfigParameter` is defined as follows:
```
ConfigParameter = {
    action :: ActionConfig
    powerList :: [PowerConfig]
}

ActionConfig = Sum | Multiply

PowerConfig = {
    weight :: Int
    assetConfig :: AssetConfig
}

AssetConfig = AssetSelection | QuadraticConfig

QuadraticConfig = {
    policy :: CurrencySymbol
    asset :: [AssetClass]
}

AssetSelection = CurrencySymbol | AssetClass | FilterConfig

FilterConfig = {
    policy :: CurrencySymbol
    filter :: TraitOption
}

TraitOption = Included Bytestring | Excluded Bytestring
```
*As we progress with implementation, we will benchmark performance and provide these benchmarks here as a way to gauge the complexity allowed in configuration prior to hitting execution or memory budget limits given the current parameters of the Cardano Mainnet.*

The `ConfigParameter` contains an action of either `Sum` or `Multiply`, we fold over all `PowerConfig` elements of powerConfig and apply the operation specified in order to get the total voting power.

Each `PowerConfig` is given a weight which can be used to modify how much it is considered when being folded in the operation mentioned previously, it also contains an `AssetConfig`. An `AssetConfig` is either an `AssetSelection` or `QuadraticConfig`.

`AssetSelection` allows for a voting power to be calculated for each asset that the user deposits that fits the selection. The selection can be a `CurrencySymbol`, `AssetClass`, or `FilterConfig`. The purpose of the `FilterConfig` is to be used with CIP-68 NFTs, it allows for a bytestring to either be forced to be included or excluded from an NFTs metadata for the NFT to count in voting power calculation.

`QuadraticConfig` allows for a single CurrencySymbol to be defined, where the user must be depositing one asset from the CurrencySymbol, and many tokens defined in the list of AssetClasses defined in the config.

### Overview of Validators
The following validators are required in order for our system to work:

- Voting Power Policy (also mints bonds to be used to unlock NFTs)
- Token Lock Validator (user NFTs and FTs are locked until voting power is burned)
- Beacon Policy (allows ease of finding user NFTs to on-chain to unlock)

The Voting Power Policy is parameterized by the `ConfigParameter`, whereas the Token Lock Validator is parameterized by the Voting Power Policy, and the Beacon Token is Parameterized by both the Token Lock Validator, and Voting Power Policy, (beacon tokens must end up only in the Token Lock Validator), voting power policy must be known by Beacon Policy to ensure the name minted is the same as the bond of the voting power policy minted.

The Voting Power Policy requires the following:

- The amount of voting power minted is equal to the amount calculated and amount specified in redeemer.
- A single bond is minted with a unique name.
- Datum in Token Lock Validator must contain the same amount of voting power as is minted, and correct bond name.

The Token Lock Validator requires the following:

- All Beacon Tokens are burned, (beacon policy stored in datum).
- Amount of Voting Power in Datum/Redeemer is burned.
- Appropriate Bond is burned.

The Beacon Policy requires the following:

- For minting, a bond of the same name must be minted. Only one can be minted.
- The Beacon Token only goes to the Token Lock Validator, and it's policy is in the datum.
- Burning is always allowed.

A full view of Datums and Redeemers can be found in the `./specs.cddl` file.