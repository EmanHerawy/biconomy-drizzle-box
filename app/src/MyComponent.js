import React, { useState } from "react";
import { toBuffer } from "ethereumjs-util";
import abi from "ethereumjs-abi";
import events from "events";

import { newContextComponents } from "@drizzle/react-components";
import logo from "./logo.png";

const { AccountData, ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => {

  // console.log(drizzleState, 'drizzleState');
  // console.log(drizzle, 'drizzle');
  const web3 = drizzle.web3;
  // const [selectedAddress, setSelectedAddress] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [quote, setQuote] = useState("");

  const [recipientAddress, setRecipientAddress] = useState("0x837DEb7B906fbcE871E80CF833f76f8562f598B3");
  // const [tokenBalance, setTokenBalance] = useState(0);
  // const [transactionState, console.log] = useState("");
  // const [transactionHash, console.log] = useState("");
  console.log(web3, 'web3');
  function requestSignature(msgParams, from) {
    web3.currentProvider.sendAsync({
      method: 'eth_signTypedData',
      params: [msgParams, from],
      from: from,
    }, (err, result) => {
      if (err) return console.error(err)
      if (result.error) {
        // User denied signature
      }
      const signature = result.result;
      alert(signature);

    });
  }
  const getSignatureParameters = signature => {
    if (!web3.utils.isHexStrict(signature)) {
      throw new Error(
        'Given value "'.concat(signature, '" is not a valid hex string.')
      );
    }
    var r = signature.slice(0, 66);
    var s = "0x".concat(signature.slice(66, 130));
    var v = "0x".concat(signature.slice(130, 132));
    v = web3.utils.hexToNumber(v);
    if (![27, 28].includes(v)) v += 27;
    return {
      r: r,
      s: s,
      v: v
    };
  };
  const constructMetaTransactionMessage = (nonce, chainId, functionSignature, contractAddress) => {
    console.log(nonce, contractAddress, chainId, 'nonce, contractAddress, chainId');
    return abi.soliditySHA3(
      ["uint256", "address", "uint256", "bytes"],
      [nonce, contractAddress, chainId, toBuffer(functionSignature)]
    );
  }

  const executeMetaTransaciton = async (userAddress, functionSignature, contract, contractAddress, chainId) => {
    var eventEmitter = new events.EventEmitter();

    if (contract && userAddress && functionSignature, chainId, contractAddress) {
      let nonce = await contract.methods.getNonce(userAddress).call();
      let messageToSign = constructMetaTransactionMessage(nonce, chainId, functionSignature, contractAddress);

      const signature = await web3.eth.personal.sign(
        "0x" + messageToSign.toString("hex"),
        userAddress
      );

      console.info(`User signature is ${signature}`);
      let { r, s, v } = getSignatureParameters(signature);

      console.log("before transaction listener");
      // No need to calculate gas limit or gas price here
      let transactionListener = contract.methods.executeMetaTransaction(userAddress, functionSignature, r, s, v).send({
        from: userAddress
      });

      transactionListener.on("transactionHash", (hash)=>{
        eventEmitter.emit("transactionHash", hash);
      }).once("confirmation", (confirmation, recipet) => {
        eventEmitter.emit("confirmation", confirmation, recipet);
      }).on("error", error => {
        eventEmitter.emit("error", error);
      });

      return eventEmitter;
    } else {
      console.log("All params userAddress, functionSignature, chainId, contract address and contract object are mandatory");
    }
  }
  const onSetQuote = async event => {
    const selectedAddress = drizzleState.accounts[0];
    if (selectedAddress) {
    if (quote != "" && selectedAddress) {
         console.log("Sending meta transaction");
        let userAddress = selectedAddress;
        let nonce = await drizzle.contracts.QuoteContract.methods.getNonce(userAddress).call();
        let functionSignature = drizzle.contracts.QuoteContract.methods.setQuote(quote).encodeABI();

        let messageToSign = constructMetaTransactionMessage(nonce,  drizzleState.web3.networkId, functionSignature, drizzle.contracts.QuoteContract.address);
        const signature = await web3.eth.personal.sign(
          "0x" + messageToSign.toString("hex"),
          userAddress
        );

        console.info(`User signature is ${signature}`);
        let { r, s, v } = getSignatureParameters(signature);

        alert(userAddress, functionSignature, r, s, v);
        sendTransaction(userAddress, functionSignature, r, s, v);

      } else {
        alert("Transaction confirmed");
      }
    }
  };

  const sendTransaction = async (userAddress, functionData, r, s, v) => {
    try {
      let gasLimit = await drizzle.contracts.QuoteContract.methods
      .executeMetaTransaction(userAddress, functionData, r, s, v)
      .estimateGas({ from: userAddress });
    let gasPrice = await web3.eth.getGasPrice();
    console.log(gasLimit);
    console.log(gasPrice);
      fetch(`https://api.biconomy.io/api/v2/meta-tx/native`, {
        method: "POST",
        headers: {
          "x-api-key": "eXnXdw7vm.82ae4614-d704-4714-a9aa-f1db8d8c921c",
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
          "to": drizzle.contracts.QuoteContract.address,
          "apiId": "e2abbec3-ab4d-4475-9d4e-9da53ff6c3ab",
          "params": [
            userAddress, functionData, r, s, v
          ],
          "from": userAddress,
          "gasPrice": web3.utils.toHex(gasPrice),
          "gasLimit": web3.utils.toHex(gasLimit)
        })
      })
        .then(response => response.json())
        .then(function (result) {
          console.log({result});
          alert(`Transaction sent by relayer with hash ${result.txHash}`);

        })
        .catch(function (error) {
          console.log(error,'error')
        });
    } catch (error) {
      console.log(error);
    }

  };
  const onTokenMint = async event => {
    const selectedAddress = drizzleState.accounts[0];
    if (selectedAddress) {
      let userAddress = recipientAddress;
      let tokenToTransfer = tokenAmount;
      if (!userAddress) {
        return alert("Please enter the recipient address");
      }
      if (!tokenToTransfer) {
        return alert("Please enter tokens to transfer");
      }

      if (drizzleState.contracts.GasLessToken) {
        // tokenToTransfer = tokenToTransfer*Math.pow(10, decimal);


        let functionSignature = drizzle.contracts.GasLessToken.methods.mint(userAddress, tokenToTransfer.toString()).encodeABI();
        console.log(functionSignature, 'functionSignature');
        let result = await executeMetaTransaciton(selectedAddress, functionSignature, drizzle.contracts.GasLessToken, drizzle.contracts.GasLessToken.address, drizzleState.web3.networkId);
        result.on("transactionHash", (hash)=>{
          console.log({hash});
          console.log("PENDING");
        }).once("confirmation", (confirmation, recipet) => {
          console.log("CONFIRMED");
         }).on("error", (error)=>{
          console.log(error);
        })

      }
    } else {
      alert("User account not initialized");
    }
  }

  const onTokenTransfer = async event => {
    const selectedAddress = drizzleState.accounts[0];

    if (selectedAddress) {
      let tokenToTransfer = tokenAmount;
      if (!recipientAddress) {
        return alert("Please enter the recipient address");
      }
      if (!tokenToTransfer) {
        return alert("Please enter tokens to transfer");
      }

      if (drizzleState.contracts.GasLessToken) {
        // tokenToTransfer = tokenToTransfer*Math.pow(10, decimal);
        let functionSignature = drizzleState.contracts.GasLessToken.methods.transfer(recipientAddress, tokenToTransfer.toString()).encodeABI();

        let result = await executeMetaTransaciton(selectedAddress, functionSignature, drizzle.contracts.GasLessToken, drizzle.contracts.GasLessToken.address, drizzleState.web3.networkId);
        result.on("transactionHash", (hash)=>{
          console.log({hash});
          console.log("PENDING");
        }).once("confirmation", (confirmation, recipet) => {
          console.log("CONFIRMED");
         }).on("error", (error)=>{
          console.log(error);
        })

      }
    } else {
      alert("User account not initialized");
    }
  }
  // destructure drizzle and drizzleState from props
  return (
    <div className="App">
      <div>
        <img src={logo} alt="drizzle-logo" />
        <h1>Biconomy with Drizzle Examples</h1>
        <p>
          Examples of how to get started with Biconomy and  Drizzle in various situations.
        </p>
      </div>

      <div className="section">
        <h2>Active Account</h2>
        <AccountData
          drizzle={drizzle}
          drizzleState={drizzleState}
          accountIndex={0}
          units="ether"
          precision={3}
        />
      </div>

      <div className="section">
        <h2>SimpleStorage bicomomy API</h2>
        <p>
          This shows a simple  implementation SDK
        </p>
        <p>
          <strong>Stored Value: </strong>
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="SimpleStorage"
            method="storedData"
          />
        </p>
        <ContractForm drizzle={drizzle} contract="SimpleStorage" method="set" />
      </div>

      <div className="section">
        <h2>GasLessToken</h2>
        <p>
          Here we have used biconomy Native Meta Transactions with biconomy sdk
        </p>
        <p>
          <strong>Total Supply: </strong>
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="GasLessToken"
            method="totalSupply"
            methodArgs={[{ from: drizzleState.accounts[0] }]}
          />{" "}
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="GasLessToken"
            method="symbol"
            hideIndicator
          />
        </p>
        <p>
          <strong>My Balance: </strong>
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="GasLessToken"
            method="balanceOf"
            methodArgs={[drizzleState.accounts[0]]}
          />
        </p>
        <h3>Send Tokens</h3>
        {/* <ContractForm
          drizzle={drizzle}
          contract="GasLessToken"
          method="transfer"
          labels={["To Address", "Amount to Send"]}
        /> */}
        <section>
          <div className="token-row token-input-row">
            <input type="number" placeholder="Enter amount of tokens" onChange={(event) => setTokenAmount(event.target.value)} value={tokenAmount} />
            <input type="text" placeholder="Enter recipient address" onChange={(event) => setRecipientAddress(event.target.value)} value={recipientAddress} />
          </div>
          <div className="token-row">
            <button variant="contained" color="primary" onClick={onTokenTransfer}>
              Transfer
          </button>

            <button className="action_button" variant="contained" color="primary" onClick={onTokenMint}>
              Mint
          </button>
          </div>
        </section>
      </div>

      <div className="section">
        <h2>QuoteContract</h2>
        <p>
          Finally this part shows using bicomomy api with Native Meta Transactions.
        </p>

        <strong>Latest Quote: </strong>
        <ContractData
          drizzle={drizzle}
          drizzleState={drizzleState}
          contract="QuoteContract"
          method="getQuote"
        />
      
          <p>
            Set Your quote        </p>
          <div className="token-row token-input-row">
             <input type="text" placeholder="Enter your quote" onChange={(event) => setQuote(event.target.value)} value={quote} />
          </div>
          <div className="token-row">
            <button variant="contained" color="primary" onClick={onSetQuote}>
              Save your Quote
          </button>
          </div>
     
      </div>
    </div>
  );
};
