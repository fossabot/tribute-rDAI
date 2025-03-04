<img src="./public/Tribute-banner.png" width="900" align="center">

## Overview
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FSend-Tribute%2Ftribute-rDAI.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FSend-Tribute%2Ftribute-rDAI?ref=badge_shield)


Tribute is a user interface abstraction layer that enables users to program the interest generated by their cryptoassets to recipients they wish to support, including charities, open source projects, subscription services and others. 

It is built on top of the decentralized finance stack of [DAI](https://makerdao.com/en/dai/), [Compound](https://compound.finance) and [rDAI](https://redeem.money).

The Tribute platform is comprised of two basic modules - a widget for recipients to be able to receive Tribute (a portion of the interest generated by a user's cryptoassets) and a dashboard for users to track and manage their Tribute flows.


## Getting Setup

1. clone repo
2. run `yarn` or `npm install` for dependencies
3. run `yarn start` to start the application
4. dashboard and widget should be at **localhost:1234/dashboard.html** and **localhost:1234/widget.html** respectively

## Collaboration and Contributions
Tribute is an open source project dedicated to building an infrastructure network to enable the flows of directed interest across the web.  In addition to this repo, contributions and discussions are welcomed at:
* Discourse: [Tribute Forum](https://tributeforum.io)
* Twitter: [@Send_Tribute](https://twitter.com/@Send_Tribute)

## Getting Started
### Obtaining Kovan DAI to generate rDAI
*Prerequisites*
* Web3 Wallet like MetaMask
* Some Kovan ETH --
There is a Kovan ETH faucet at https://faucet.kovan.network/ that allows you to obtain 1 Kovan ETH (KETH) per 24 hours (github login required).  1 KETH should be more than sufficient to interact with Tribute.
* Some Kovan DAI -- You need Kovan DAI that is compatible with Compound's cDAI.  Once you have some KETH, switch to the Kovan network in your wallet.  There is a faucet for the correct Kovan DAI at: https://app.compound.finance/asset/cDAI
You must first click the Enable DAI button and approve the wallet transactions, then click the Faucet button on the left, which will initiate a transfer of 100 Kovan DAI.  You can use the DAI faucet as many times as you want (and have gas to pay for), though 100 DAI should be fine to experiment with Tribute.

### Tribute-Enabled DAI
Once you have Kovan DAI in your wallet (to see it in your ERC20 token-compatible web3 wallet, add the Custom Token at 0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99), navigate to the Wallet tab on the Dashboard and click the Generate Tribute button.  

This will trigger two transaction popups - one that grants a large allowance for rDAI to transform your Kovan DAI and the second to mint rDAI from your DAI.  At the moment this will effect all of the Kovan DAI in your wallet.  Upon success, you now have Tribute-enabled DAI.  To reverse back to regular DAI, click the Disable Tribute button.  

### Tribute Functions
#### Generate Tribute
* calls Kovan DAI contract allowance() method with a very large allowance pointed at the rDAI contract
* calls Kovan rDAI mintWithNewHat() method with all kovan DAI in the user wallet
#### Disable Tribute
* calls Kovan rDAI redeemAll() method
#### Send Tribute
* calls Kovan rDAI createHat() method with new set of recipients and proportions
#### End Tribute
* calls Kovan rDAI createHat() method with new set of recipients (omitting the specified recipient) and proportions
#### Claim Tribute
* calls Kovan rDAI payInterest() method on wallet sender address
#### Claim Tribute on Behalf Of
* calls Kovan rDAI payInterest() method on specified address


### Smart Contract Dependencies
#### Kovan Testnet
##### DAI: [0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99](https://kovan.etherscan.io/address/0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99)
##### cDAI: [0x0a1e4d0b5c71b955c0a5993023fc48ba6e380496](https://kovan.etherscan.io/address/0x0a1e4d0b5c71b955c0a5993023fc48ba6e380496)
##### DaiCompoundAllocationStrategy (latest): [0xb4377efc05bd28be8e6510629538e54eba2d74e3](https://kovan.etherscan.io/address/0xb4377efc05bd28be8e6510629538e54eba2d74e3)
##### rDAI (latest): [0xea718e4602125407fafcb721b7d760ad9652dfe7](https://kovan.etherscan.io/address/0xea718e4602125407fafcb721b7d760ad9652dfe7)


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FSend-Tribute%2Ftribute-rDAI.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FSend-Tribute%2Ftribute-rDAI?ref=badge_large)