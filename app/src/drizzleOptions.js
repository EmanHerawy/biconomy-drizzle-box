import Web3 from "web3";
import Biconomy from "@biconomy/mexa";

import QuoteContract from "./contracts/QuoteContract.json";
import SimpleStorage from "./contracts/SimpleStorage.json";
import GasLessToken from "./contracts/GasLessToken.json";
// const provider = window["ethereum"];
// const biconomy = new Biconomy(provider,{apiKey: "eXnXdw7vm.82ae4614-d704-4714-a9aa-f1db8d8c921c", debug: true});

const options = {
  web3: {
    block: false,
    customProvider:  new Web3( new Biconomy(window.ethereum,{apiKey: "eXnXdw7vm.82ae4614-d704-4714-a9aa-f1db8d8c921c", debug: true})),
  },
  contracts: [SimpleStorage, QuoteContract, GasLessToken],
  events: {
    SimpleStorage: ["StorageSet"],
  },
};

export default options;
