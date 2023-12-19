# Research Document: Agora Suite Expansion - NFT Standards and Novel Token Structures Integration

## I. Introduction
We propose a new approach for the expansion of the Agora governance suite on the Cardano network by introducing Non-Fungible Token (NFT) integration solutions. This innovative initiative aims to overcome current limitations within Agora, fostering a more versatile and feature-rich decentralized application (dApp) ecosystem on Cardano.
In this exploration, our focus is on identifying and evaluating novel NFT integration methodologies. Our goal is to meticulously assess the strengths, weaknesses, of these approaches. The insights gathered will serve as the foundation for the development of an enhanced Agora suite, offering an innovative and comprehensive solution to the existing challenges. Through this expansion, we aim to not only address the identified limitations but also set the stage for a more dynamic and adaptable governance platform on the Cardano blockchain.
Keywords:
*Agora, Cardano, Non-Fungible Token (NFT), Decentralized Application (dApp), Blockchain, Cardano Improvement Proposal (CIP)Smart Contracts, Decentralized Autonomous Organizations (DAOs)*
## II. Problem Delineation
### Current Capabilities of Agora:
Agora stands as a robust governance suite on the Cardano blockchain, providing a versatile structure with a range of functionalities. It currently empowers various entities, including B2B and B2C enterprises, DAOs, dApps, and community members. Members of groups using Agora benefit from the ability to:
 - Draft and Initiate Proposals
 - Cast Token-Weighted Votes on Active Proposals
 - Delegate Voting Power to other members, to Meet Participation Thresholds
 - Progress Proposals from Phase to Phase.
 - Execute effects of a Proposal, based on the voting results.
### Identified Limitation:
However, the current capabilities of Agora, while comprehensive in governance aspects, do not extend to support Non-Fungible Token (NFT) standards. This limitation hampers the potential for incorporating NFTs into the governance ecosystem, restricting the development of diverse decentralized applications (dApps) that leverage NFTs.
#### **Specific Constraints**:
**Limited NFT Support**: Agora lacks built-in support for NFT standards, hindering the seamless integration of NFT functionalities into the governance processes.
Versatility Restriction: The absence of NFT support restricts the versatility of proposals and voting mechanisms, as NFTs could be integral to unique voting rights, proposal collateral, or other innovative governance features.

**Missed Opportunities**: The inability to interact with NFTs within the governance structure overlooks potential use-cases where tokenized assets or unique digital assets could play a significant role in decision-making processes.
#### **Impact on Development**:
The current Agora structure, while robust for conventional governance scenarios, falls short of embracing the full spectrum of possibilities offered by NFT integration. As the blockchain space evolves with a growing emphasis on tokenization and unique digital assets, this limitation could hinder the broader adoption of Agora for innovative projects and decentralized applications.

**Projected Resolution Impact**:
Addressing the lack of NFT support within Agora is not only about accommodating a specific token standard but unlocking a realm of creative possibilities for decentralized governance. By extending Agora to support NFT standards, we envision:

- Innovative Governance Proposals: NFT integration can enable proposals tied to unique digital assets, fostering creativity and diverse use-cases within the Cardano ecosystem.
- Enhanced Voter Engagement: NFT-based voting mechanisms can introduce novel ways for token holders to participate, creating a more engaging and inclusive governance experience.
- Tokenized Collateral: Smart contracts within Agora can utilize NFTs as collateral, opening up new avenues for proposal backing and participation.

## III. Existing NFT Integration Solutions & Related Work
This section delves into the existing standards within the Cardano ecosystem and explores custom-developed alternatives to address the growing demands for comprehensive NFT functionalities. As we embark on this exploration, our primary focus is on two significant Cardano Improvement Proposals (CIPs) – CIP-25 and its extension, CIP-68 – which form the bedrock of NFT standards within the Cardano community.

CIP-25, ratified to establish a standardized framework for NFTs, has played a pivotal role in shaping the Cardano ecosystem. Its clear documentation and guidelines have garnered widespread acceptance, positioning it as the de facto NFT standard. However, as we navigate the strengths and weaknesses of CIP-25, it becomes apparent that while it provides a robust foundation, there are limitations in flexibility, especially in accommodating unconventional use cases that require smart contracts.

In response to the evolving needs of the Cardano community, CIP-68 emerges as a noteworthy extension of CIP-25. This community-driven effort, proposed by Berry Ales, aims to enhance the capabilities of Cardano's NFT framework. CIP-68 not only addresses specific shortcomings in the original standard but also introduces additional features catering to more complex NFT use cases. CIP-68 has gained momentum through active community involvement and ongoing support for development. However, potential fragmentation in adoption and increased development effort for advanced functionalities present challenges that necessitate careful community coordination.

### 1. CIP-25: NFT Standard for Cardano
CIP-25, or the Cardano Improvement Proposal 25, ratified to establish a standardized framework for Non-Fungible Tokens (NFTs) within the Cardano ecosystem. The proposal gained widespread acceptance due to its clear documentation and guidelines, providing a foundational structure for the creation and interaction of NFTs on the Cardano network.
#### **Strengths**:
- Community Recognition: CIP-25 is widely recognized and embraced within the Cardano community as the de facto NFT standard.
Compatibility: The standard exhibits strong compatibility with Cardano's existing infrastructure, ensuring seamless integration into smart contracts.
#### **Weaknesses**:
- Limited Flexibility: While providing a robust foundation, CIP-25 exhibits limitations in flexibility, especially in accommodating unconventional use cases.
### 2. CIP-68: Extended NFT Standard
CIP-68 stands as a testament to community-driven efforts to enrich Cardano's NFT framework. An extension of CIP-25, it was introduced to address specific shortcomings in the original standard and to provide additional features catering to more complex NFT use cases. Proposed by Berry Ales, this proposal gained momentum through active community involvement and ongoing support for development.
#### **Strengths**:
- Enrichment: CIP-68 builds upon CIP-25, introducing additional features that enhance the standard's capabilities for diverse NFT applications.
- Community Support: Active community support has fueled ongoing development and improvement, making it a dynamic and evolving proposition.
#### **Weaknesses and Challenges**:
- Potential Fragmentation: CIP-68 acknowledges potential fragmentation in the adoption of the standard due to the introduction of extended features, requiring careful community coordination.
- Development Effort: Projects leveraging advanced functionalities under CIP-68 may require additional development effort, impacting the accessibility of certain features.

## IV. Potential Resolution Approaches
In order to adequately accomodate both CIP-25 and CIP-68 NFTs, while also allowing for more novel governance, we need to accomplish the following.
### 1. Incorporation of CIP-25 and CIP-68:
Extend Agora with additional validators to support the widely-accepted CIP-25 standard and its extended version, CIP-68.
This means each NFT from a single policy would have a single voting power.
### 2. Incorporation of CIP-68 Capabilities:
Extend Agora with additional validators to support the ability to leverage metadata in voting power calculation.
### 3. Incorporation of Combining Policies:
Extend Agora with additional validators to support the ablity to use multiple policies with different voting power calculations.
This should also support the use of specific assets for fungible tokens.

### **We have identified the following approaches**:
### 1. Stake Voting Power upon Calculation (Control via NFT lock validator):
Because of how Agora's interoperability is designed, a UTxO from a validator must be moved in order to indicate approval from that contract.
This approach entails leveraging the validator where the NFTs are locked in order to control the Stake UTxO within the Agora core, this approach requires that the NFT lock validator runs every time the User interacts with their Agora stake.
### 2. Stake Voting Power upon Calculation (Control via separate validator):
This approach entails leveraging a separate validator from where the NFTs are locked in order to control the Stake UTxO within the Agora core. This approach introduces additional unwanted complexity to the system, but the benefit is that the validator that runs in order to control the Stake UTxO is able to be simplified and therefore the cost of interacting with Agora will be lower for users.
### 3. Calculate Voting Power separate to Staking Voting power:
This approach would require that NFT(s) are locked into a validator when minting of voting power occurs. Because voting power is fungible this means that each validator containing the locked NFT(s) would need to be locked not only by voting power tokens, but also either a bond or signature from the user. This approach is efficient for interacting with Agora, but introduces unwanted complexity to way the user will interact with the system, requiring more understanding from the user.
*Note: This approach could be simplified for UX purposes by using a single Tx to Mint and also Stake the Voting Power tokens.*

## V. Conclusion
This research document provides a thorough analysis of NFT integration solutions for the Agora governance suite on Cardano, focusing on CIP-25 and CIP-68 standards. The document outlines strengths, weaknesses, and theoretical operational efficiency of each solution. The delineated problem of limited NFT and fungible token functionality within Agora has been addressed with two potential resolution approaches, including the incorporation of CIP standards and the development of a custom NFT integration framework. This research serves as a foundation for the development of an enhanced Agora suite, fostering a more innovative and versatile dApp ecosystem on the Cardano network
