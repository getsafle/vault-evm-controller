# Vault-evm-Controller<code><a href="https://www.docker.com/" target="_blank"><img height="50" src="https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880"></a></code>

[![npm version](https://badge.fury.io/js/@getsafle%2Fvault-evm-controller.svg)](https://badge.fury.io/js/@getsafle%2Fvault-evm-controller) <img alt="Static Badge" src="https://img.shields.io/badge/License-MIT-green"> [![Discussions][discussions-badge]][discussions-link]
<img alt="Static Badge" src="https://img.shields.io/badge/Evm_controller-documentation-purple">

A Module written in javascript for managing various keyrings of Ethereum accounts, encrypting them, and using them.

- [Installation](#installation)
- [Initialize the Evm Controller class](#initialize-the-evm-controller-class)
- [Methods](#methods)
  - [Generate Keyring with 1 account and encrypt](#generate-keyring-with-1-account-and-encrypt)
  - [Restore a keyring with the first account using a mnemonic](#restore-a-keyring-with-the-first-account-using-a-mnemonic)
  - [Add a new account to the keyring object](#add-a-new-account-to-the-keyring-object)
  - [Export the private key of an address present in the keyring](#export-the-private-key-of-an-address-present-in-the-keyring)
  - [Sign a transaction](#sign-a-transaction)
  - [Sign a message](#sign-a-message)
  - [Get balance](#get-balance)

## Installation

`npm install --save @getsafle/vault-evm-controller`

## Initialize the Evm Controller class

```
const { KeyringController, getBalance } = require('@getsafle/vault-evm-controller');

const evmController = new KeyringController({
  txType: //0 or 2
  encryptor: {
    // An optional object for defining encryption schemes:
    // Defaults to Browser-native SubtleCrypto.
    encrypt(password, object) {
      return new Promise('encrypted!');
    },
    decrypt(password, encryptedString) {
      return new Promise({ foo: 'bar' });
    },
  },
});
```

## Methods

### Generate Keyring with 1 account and encrypt

```
const keyringState = await evmController.createNewVaultAndKeychain(password);
```

### Restore a keyring with the first account using a mnemonic

```
const keyringState = await evmController.createNewVaultAndRestore(password, mnemonic);
```

### Add a new account to the keyring object

```
const keyringState = await evmController.addNewAccount(keyringObject);
```

### Export the private key of an address present in the keyring

```
const privateKey = await evmController.exportAccount(address);
```

### Sign a transaction

```
const signedTx = await evmController.signTransaction(ethTx, _fromAddress);
```

### Sign a message

```
const signedMsg = await evmController.signMessage(msgParams);
```

### Sign a message

```
const signedObj = await evmController.sign(msgParams, pvtKey, web3Obj);
```

### Sign Typed Data (EIP-712)

```
const signedData = await evmController.signTypedMessage(msgParams);
```

### Get balance

```
const balance = await getBalance(address, web3);
```

### Send Transaction

```
const receipt = await evmController.sendTransaction(signedTx, web3);
```

### Calculate Tx Fees

```
const fees = await evmController.getFees(rawTx, web3);
```

[discussions-badge]: https://img.shields.io/badge/Code_Quality-passing-rgba
[discussions-link]: https://github.com/getsafle/vault-evm-controller/actions
