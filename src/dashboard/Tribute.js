import 'babel-polyfill';
import { ethers } from 'ethers';
const { bigNumberify, toNumber, formatEther } = ethers.utils;
const { WeiPerEther } = ethers.constants;

export default function Tribute(DAIContract, rDAIContract, provider, address) {
  this.DAIContract = DAIContract;
  this.rDAIContract = rDAIContract;
  this.provider = provider;
  this.signer = provider.getSigner();
  this.DAIContract = this.DAIContract.connect(this.signer);
  this.rDAIContract = this.rDAIContract.connect(this.signer);
  this.address = address;

  // [you are in first] in hat allocations, this never changes
  // every time the pricipal changes we make a new hat
  // add more rdai to your account while updating you hat
  this.generateTribute = async amountToTribute => {
    let bignumberAmount = bigNumberify(amountToTribute).mul(WeiPerEther);
    await this.DAIContract.approve(rDAIContract.address, bignumberAmount);

    let rDAIbalanceBigNumber = await this.rDAIContract.balanceOf(
      this.address[0]
    );
    let balance = rDAIbalanceBigNumber.div(WeiPerEther).toNumber();

    let currentHat = await this.rDAIContract.getHatByAddress(this.address[0]);

    // check for zero hat Self hat also gives you a zero hat
    if (currentHat.hatID.isZero()) {
      // if we're on zero hat we simply set a new hat
      await this.rDAIContract.mintWithNewHat(
        bignumberAmount.toNumber(),
        [this.address[0]],
        [1]
      );
    } else {
      // TODO: check if the first address is the users address.
      // Otherwise the hat was not made by us and we need to fix the hat

      const proportionsSum = currentHat.proportions.reduce(
        (accl, value) => accl + value
      );
      // assuming that hat has users address in first slot
      let proportionsInTribute = currentHat.proportions.map(portion => {
        return (portion / proportionsSum) * balance;
      });
      // add to user slot
      proportionsInTribute[0] += amountToTribute;

      await this.rDAIContract.mintWithNewHat(
        bignumberAmount,
        currentHat.recipients,
        proportionsInTribute
      );
    }
  };

  // reedemm all your rdai to dai
  this.disableTribute = async () => {
    await this.rDAIContract.redeemAll();
  };

  // this function mints rDAI to your account
  this.getRDAI = async amount => {
    console.log(amount);
    console.log(bigNumberify(amount).mul(WeiPerEther));
    console.log(rDAIContract.address);
    // what happens when approval works but mint gets dropped
    await this.DAIContract.approve(
      rDAIContract.address,
      bigNumberify(amount).mul(WeiPerEther)
    );
    // dont call newhat
    await this.rDAIContract.mint(bigNumberify(amount).mul(WeiPerEther));
    let output = await this.rDAIContract.getHatByAddress(this.address);
    console.log(output);
  };

  this.getTributes = async () => {
    const currentHat = await this.rDAIContract.getHatByAddress(this.address[0]);
    // get user balance
    const balanceBigNumber = await this.rDAIContract.balanceOf(this.address[0]);
    const balance = balanceBigNumber.div(WeiPerEther).toNumber();

    // Get unclaimed tribute - copy of getUnclaimedTribute()
    let unclaimedTribute = await this.rDAIContract.interestPayableOf(
      this.address[0]
    );
    unclaimedTribute = formatEther(unclaimedTribute);

    let activeRecipients = [];
    let activeTributeAmounts = [];
    let totalTribute = 0;
    let unallocatedTribute = 0;
    // Check if the user has a hat
    if (currentHat.proportions && currentHat.proportions.length > 0) {
      // calculate the current proportions in units of Tribute
      const proportionsSum = currentHat.proportions.reduce(
        (accl, value) => accl + value
      );
      const proportionsInTribute = currentHat.proportions.map(portion => {
        return (portion / proportionsSum) * balance;
      });
      console.log('Current hat: ', currentHat.recipients, proportionsInTribute);

      // Get a searcheable lowercase recipient list
      const recipientsLowerCase = currentHat.recipients.map(a =>
        a.toLowerCase()
      );

      // Check if the user has unallocated Tribute
      const selfIndex = recipientsLowerCase.indexOf(
        this.address[0].toLowerCase()
      );
      unallocatedTribute = proportionsInTribute[selfIndex];

      // Remove the user from the arrays
      activeRecipients = currentHat.recipients;
      activeRecipients.splice(selfIndex, 1);
      activeTributeAmounts = proportionsInTribute;
      activeTributeAmounts.splice(selfIndex, 1);

      totalTribute = await this.rDAIContract.balanceOf(this.address[0]);
      totalTribute = totalTribute.div(WeiPerEther).toNumber();
    }

    return {
      activeTributes: {
        recipients: activeRecipients,
        tributeAmounts: activeTributeAmounts
      },
      tributeBalance: totalTribute,
      unallocatedTribute,
      unclaimedTribute
    };
  };

  // send and end
  this.sendTribute = async (recipientAddress, amount) => {
    // begin flowing of tribute from an account to another account

    // TODO: validate recipientAddress

    const currentHat = await this.rDAIContract.getHatByAddress(this.address[0]);
    // get user balance
    const balanceBigNumber = await this.rDAIContract.balanceOf(this.address[0]);
    const balance = balanceBigNumber.div(WeiPerEther).toNumber();

    // Check if the user has a hat
    if (currentHat.proportions.length < 1) throw "You don't have any Tribute";

    // calculate the current proportions in units of Tribute
    const proportionsSum = currentHat.proportions.reduce(
      (accl, value) => accl + value
    );
    const proportionsInTribute = currentHat.proportions.map(portion => {
      return (portion / proportionsSum) * balance;
    });
    console.log('Current hat: ', currentHat.recipients, proportionsInTribute);

    // Get a searcheable lowercase recipient list
    const recipientsLowerCase = currentHat.recipients.map(a => a.toLowerCase());

    // Check if the user has enough unallocated Tribute
    const selfIndex = recipientsLowerCase.indexOf(
      this.address[0].toLowerCase()
    );
    if (selfIndex < 0)
      throw 'Not enough unallocated tribute. You have 0 unallocated Tribute available';
    const unallocatedTribute = proportionsInTribute[selfIndex];
    if (unallocatedTribute < amount)
      throw `Not enough unallocated tribute. You have ${unallocatedTribute} unallocated Tribute available`;
    console.log('Unallocated tribute: ', unallocatedTribute);

    // Create the new values
    let newProportionsInTribute = proportionsInTribute;
    let newRecipients = recipientsLowerCase;

    // Scenario 1: Recipient is not already included in the hat
    if (!newRecipients.includes(recipientAddress.toLowerCase())) {
      newRecipients.push(recipientAddress.toLowerCase());
      // Increase the proportion of the recipient by amount
      newProportionsInTribute[newRecipients.length - 1] = amount;
      // Decrease the proportion of user by amount
      newProportionsInTribute[selfIndex] -= amount;
    }
    console.log('New hat: ', newRecipients, newProportionsInTribute);

    // Scenario 2: Recipient is already icluded in the hat
    // TODO: de-scoped for demo. until then, call endTribute to first remove the recipient from the hat before adding them back with the new amount.

    // Set the new hat
    let greatestSize = 0;
    newProportionsInTribute.forEach(portion => {
      const integer = portion.toString().split('.')[0];
      if (integer) {
        if (integer.length > greatestSize) greatestSize = integer.length;
      }
    });
    const MAX_SIZE = 9; // Must be uint32 e.g. less than 4,294,967,295
    const decimalMultiplier = MAX_SIZE - greatestSize;
    const newProportions = newProportionsInTribute.map(portion => {
      return Math.trunc(portion * Math.pow(10, decimalMultiplier));
    });
    await this.rDAIContract.createHat(newRecipients, newProportions, true);
  };

  this.endTribute = async address => {
    // begin flowing of tribute from an account to another account

    // TODO: validate recipientAddress

    const currentHat = await this.rDAIContract.getHatByAddress(this.address[0]);
    // get user balance
    const balanceBigNumber = await this.rDAIContract.balanceOf(this.address[0]);
    const balance = balanceBigNumber.div(WeiPerEther).toNumber();
    if (currentHat.proportions.length < 1) throw "You don't have any Tribute";
    // calculate the current proportions in units of Tribute
    const proportionsSum = currentHat.proportions.reduce(
      (accl, value) => accl + value
    );
    const proportionsInTribute = currentHat.proportions.map(portion => {
      return (portion / proportionsSum) * balance;
    });
    console.log('Current hat: ', currentHat.recipients, currentHat.proportions);

    // Get a searcheable lowercase recipient list
    const recipientsLowerCase = currentHat.recipients.map(a => a.toLowerCase());

    // Create the new values
    let newProportions = currentHat.proportions;
    let newRecipients = recipientsLowerCase;

    // Check if the recipient is included in the hat
    const removeAddressIndex = recipientsLowerCase.indexOf(
      address.toLowerCase()
    );
    if (removeAddressIndex < 0) {
      throw 'You are not sending any Tribute to this address.';
    }

    // If so, remove the recipient from the new hat
    newRecipients.splice(removeAddressIndex, 1);

    // Add user to new hat if necessary
    let selfIndex = recipientsLowerCase.indexOf(this.address[0].toLowerCase());
    if (selfIndex < 0) {
      newRecipients.push(this.address[0]);
      selfIndex = newRecipients.length - 1;
    }

    // Get the removed address proportions
    const removeAddressProportion = currentHat.proportions[removeAddressIndex];
    console.log(removeAddressProportion);
    // Increase the proportion of user by amount
    newProportions[selfIndex] += removeAddressProportion;

    // Remove the proportion from the new hat
    newProportions.splice(removeAddressIndex, 1);

    console.log('New hat (proportion): ', newRecipients, newProportions);

    await this.rDAIContract.createHat(newRecipients, newProportions, true);
  };

  // Claiming Tribute functions

  // Get the amount of unclaimed tribute
  this.getUnclaimedTribute = async () => {
    const response = await this.rDAIContract.interestPayableOf(this.address[0]);
    const output = response.div(WeiPerEther).toNumber();
    return output;
  };

  // Get the amount of unclaimed tribute
  this.getUnclaimedTributeOnBehalfOf = async address => {
    const response = await this.rDAIContract.interestPayableOf(address);
    const output = response.div(WeiPerEther).toNumber();
    return output;
  };

  // calling interest payable of and converting to rdai
  this.claimTribute = async () => {
    //this cashes out all rDAI in both interest
    //and principal and sends it back to the user
    await this.rDAIContract.payInterest(this.address[0]);
  };

  // calling pay interest payable of and converting to rdai
  this.claimTributeOnBehalfOf = async address => {
    //this cashes out all rDAI in both interest
    //and principal and sends it back to the user
    await this.rDAIContract.payInterest(address);
  };
}
