import 'babel-polyfill';
import { ethers } from 'ethers';
const { bigNumberify, formatUnits } = ethers.utils;

export default class Tribute {

  constructor(DAIContract, rDAIContract, userAddress) {
    this.DAIContract = DAIContract;
    this.rDAIContract = rDAIContract;
    this.userAddress = userAddress;
    this.PROPORTION_BASE = bigNumberify("0xFFFFFFFF");
  }

  async generate(amountToTribute) {
    const decimals_DAI = await this.DAIContract.decimals();
    const decimals_rDAI = await this.rDAIContract.decimals();
    
    // approve DAI
    const amountToTribute_BN = bigNumberify(amountToTribute).mul(decimals_DAI);
    await this.DAIContract.approve(this.rDAIContract.address, amountToTribute_BN);

    // get rDAI balance
    const rDAIBalance_BN = await this.rDAIContract.balanceOf(userAddress);
    const balance = rDAIBalance_BN.div(decimals_rDAI).toNumber();

    const currentHat = await this.rDAIContract.getHatByAddress(userAddress);
    const SELF_HAT_ID = await this.rDAIContract.SELF_HAT_ID;

    const {receipents, proportions} = currentHat;

    // calculate proportions whole numbers
    let portionWholeNum = proportions.map(portion => {
        return (portion / this.PROPORTION_BASE) * balance;
    });

    // convert to object mapping
    let recipientMap = {};
    receipents.forEach((address, i) => recipientMap[address] = portionWholeNum[i]);

    let userBal = recipientMap[this.userAddress] ? recipientMap[this.userAddress] : balance;

    recipientMap[this.userAddress] = userBal + amountToTribute;

    await this.rDAIContract.createHat(
        Object.keys(recipientMap),
        Object.values(recipientMap),
        true
    );
  }

  // reedemm all your rdai to dai
  async disable() {
    await this.rDAIContract.redeemAll();
  }

  async getInfo() {
    let decimals_rDAI = await this.rDAIContract.decimals();
    
    // Balance
    const rDAIBalance_BN = await this.rDAIContract.balanceOf(this.userAddress);
    let unclaimedBalance_BN = await this.rDAIContract.interestPayableOf(this.userAddress);
    
    // Check if the user has a hat
    const currentHat = await this.rDAIContract.getHatByAddress(this.userAddress);    
    
    let { recipients, proportions } = currentHat;
    let unallocatedBalance;
    let portionWholeNum;

    //check if hat is empty
    if (recipients.length === 0) {
      unallocatedBalance = rDAIBalance_BN
    } else {

      // set all recepients to lower case to allow searching
      recipients = currentHat.recipients.map(r => r.toLowerCase());
      
      portionWholeNum = proportions.map(portion => {
          return bigNumberify(portion)
                      .div(this.PROPORTION_BASE)
                      .mul(rDAIBalance_BN);
      });
      let userIdx = recipients.indexOf(this.userAddress.toLowerCase())

      //check if user exists 
      if ( userIdx < 0) {
        unallocatedBalance = ethers.constants.Zero;
      } else {
        unallocatedBalance = portionWholeNum[userIdx];

        //remove user from portionWholeNum
        recipients.splice(userIdx, 1); // remove user from recipients
        portionWholeNum.splice(userIdx, 1); // remove user from the proportions
      }
    }
   
    return {
      allocations: {
        recipients: recipients.map(recipient => ethers.utils.getAddress(recipient)),
        proportions: portionWholeNum.map(portion => formatUnits(portion, decimals_rDAI))
      },
      balance: formatUnits(rDAIBalance_BN, decimals_rDAI),
      unallocated_balance: formatUnits(unallocatedBalance, decimals_rDAI),
      unclaimed_balance: formatUnits(unclaimedBalance_BN, decimals_rDAI)
    };
  }

  async startFlow(recipientAddress, amount) {
    const decimals_rDAI = await this.rDAIContract.decimals();

    // getBalance
    const balance_BN = await this.rDAIContract.balanceOf(this.userAddress);
    const balance = balance_BN.div(decimals_rDAI).toNumber();

    const currentHat = await this.rDAIContract.getHatByAddress(this.userAddress);
    const SELF_HAT_ID = await this.rDAIContract.SELF_HAT_ID;

    const {receipents, proportions} = currentHat;

    // calculate proportions whole numbers
    let portionWholeNum = proportions.map(portion => {
      return (portion / this.PROPORTION_BASE) * balance;
    });
    
    //turn recipients and proportions into map
    let recipientMap = {};
    receipents.forEach((address, i) => recipientMap[address] = portionWholeNum[i]);

    //validate if hat !exist
    if (currentHat.hatID.eq(SELF_HAT_ID) || currentHat.hatId.isZero()) {
      if (balance < amount) throw "insuffient balance";
    }

    //validate if there are amounts left in user portion
    if (!(this.userAddress in recipientMap)) throw "insufficient balance left";

    let userBal = recipientMap[this.userAddress] ? recipientMap[this.userAddress] : balance;
    let receipientBal = recipientMap[recipientAddress] ? recipientMap[receipientAddress] : 0;
    let sum = userBal + receipientBal;
    if (sum < amount) throw "insufficent balance left";

    //We have enough to update, continue and update values
  
    //update values between user and receipient
    const amountNeeded = amount - receipientBal;
    userBal -= amountNeeded;
    receipientBal += amountNeeded;

    //set values
    recipientMap[this.userAddress] = userBal;
    recipientMap[recipientAddress] = receipientBal;

    // remove addresses that have 0 flow
    for (let [address, balance] of Object.entries(recipientMap)) {
        if (balance == 0) {
            delete recipientMap[address];
        }
    }
    //update to new hat values
    await this.rDAIContract.createHat(
      Object.keys(recipientMap),
      Object.values(recipientMap),
      true
    );
  }

  // removes rDai interest assigned to addressToRemove
  // and reflows it back to self
  async endFlow(addressToRemove) {
    // TODO: validate recipientAddress
    const decimals_rDAI = await this.rDAIContract.decimals();

    // getBalance
    const balance_BN = await this.rDAIContract.balanceOf(this.userAddress);
    const balance = balance_BN.div(decimals_rDAI).toNumber();

    const currentHat = await this.rDAIContract.getHatByAddress(this.userAddress);
    const SELF_HAT_ID = await this.rDAIContract.SELF_HAT_ID;

    const {receipents, proportions} = currentHat;

    // calculate proportions whole numbers
    let portionWholeNum = proportions.map(portion => {
      return (portion / this.PROPORTION_BASE) * balance;
    });
    
    // turn recipients and proportions into map
    let recipientMap = {};
    receipents.forEach((address, i) => recipientMap[address] = portionWholeNum[i]);

    // validate if hat !exist
    if (currentHat.hatID.eq(SELF_HAT_ID) || currentHat.hatId.isZero()) throw "No flows to end";
    
    // validate if there are amounts left in user portion
    if(!(addressToRemove in recipientMap)) throw `address: ${addressToRemove} does not exist`;

    let userBal = recipientMap[this.userAddress] ? recipientMap[this.userAddress] : 0;
    let receipientBal = recipientMap[recipientAddress];
    
    //update and set values between user and receipient
    recipientMap[this.userAddress] = userBal + receipientBal;
    recipientMap[recipientAddress] = 0;

    // remove addresses that have 0 flow
    for (let [address, balance] of Object.entries(recipientMap)) {
        if (balance == 0) {
            delete recipientMap[address];
        }
    }

    //update to new hat values
    await this.rDAIContract.createHat(
      Object.keys(recipientMap),
      Object.values(recipientMap),
      true
    );
  }

  async getUnclaimedAmount(address) {
    const response = await this.rDAIContract.interestPayableOf(address);
    const output = response.div(WeiPerEther).toNumber();
    return output;
  }

  async claimAmount(address) {
    //this cashes out all rDAI in both interest
    //and principal and sends it back to the user
    await this.rDAIContract.payInterest(address);
  }
}
