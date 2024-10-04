const assert = require("assert");
const Web3 = require("web3");
const CryptoJS = require("crypto-js");
const { KeyringController, getBalance } = require("../src");
const crypto = require("crypto");
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");
const {
  HD_WALLET_12_MNEMONIC,
  EXTERNAL_ACCOUNT_PRIVATE_KEY,
  EXTERNAL_ACCOUNT_ADDRESS,
  EXTERNAL_ACCOUNT_ADDRESS_TO_GET_FEE,
  TRANSFER_AMOUNT,
  RECEIVER_ADDRESS,
} = require("./constants");

const PASSWORD = "random_password";

const NETWORKS = {
  ethereum: {
    URL: "https://eth.llamarpc.com",
    CHAIN_ID: 1,
  },
  bsc: {
    URL: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    CHAIN_ID: 97,
  },
  polygon: {
    URL: "https://polygon-amoy-bor-rpc.publicnode.com",
    CHAIN_ID: 80001,
  },
  optimism: {
    URL: "https://optimism.llamarpc.com",
    CHAIN_ID: 10,
  },
  arbitrum: {
    URL: "https://sepolia-rollup.arbitrum.io/rpc",
    CHAIN_ID: 421614,
  },
  mantle: {
    URL: "https://rpc.mantle.xyz",
    CHAIN_ID: 5001,
  },
  velas: {
    URL: "https://explorer.testnet.velas.com/rpc",
    CHAIN_ID: 111,
  },
  avalanche: {
    URL: "https://api.avax-test.network/ext/bc/C/rpc",
    CHAIN_ID: 43113,
  },
  base: {
    URL: "https://base-sepolia.blockpi.network/v1/rpc/public",
    CHAIN_ID: 84532,
  },
  zkEVM: {
    URL: "https://polygon-zkevm.drpc.org",
    CHAIN_ID: 1442,
  },
  bevm: {
    URL: "https://testnet.bevm.io/",
    CHAIN_ID: 1978,
  },
  rootstock: {
    URL: "https://public-node.testnet.rsk.co",
    CHAIN_ID: 31,
  },
};

const chainConfigs = {
  ethereum: { symbol: "ETH", txType: 2 },
  bsc: { symbol: "BSC", txType: 0 },
  polygon: { symbol: "MATIC", txType: 2 },
  optimism: { symbol: "OP", txType: 2 },
  arbitrum: { symbol: "ARB", txType: 2 },
  mantle: { symbol: "MNT", txType: 2 },
  velas: { symbol: "VLX", txType: 0 },
  avalanche: { symbol: "AVAX", txType: 2 },
  base: { symbol: "BASE", txType: 2 },
  zkEVM: { symbol: "ZKEVM", txType: 2 },
  bevm: { symbol: "BTC", txType: 0 },
  rootstock: { symbol: "RBTC", txType: 0 },
};

const opts = {
  encryptor: {
    encrypt(pass, object) {
      return CryptoJS.AES.encrypt(JSON.stringify(object), pass).toString();
    },
    decrypt(pass, encryptedString) {
      const bytes = CryptoJS.AES.decrypt(encryptedString, pass);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    },
  },
};

// Existing imports and constants...

describe("EVM Controller Tests", () => {
  let evmController;

  before(() => {
    evmController = new KeyringController(opts);
  });

  it("Should create new vault and keychain", async () => {
    const res = await evmController.createNewVaultAndKeychain(PASSWORD);
    assert(res, "Failed to create new vault and keychain");
  });

  it("Should create new vault and restore", async () => {
    const res = await evmController.createNewVaultAndRestore(
      PASSWORD,
      HD_WALLET_12_MNEMONIC
    );
    assert(
      evmController.keyrings[0].mnemonic === HD_WALLET_12_MNEMONIC,
      "Wrong mnemonic"
    );
  });

  it("should add new account", async () => {
    await evmController.addNewAccount(evmController.keyrings[0]);
    const newAccount = evmController.memStore._state.keyrings[0].accounts[1];

    assert(
      newAccount.toString() === "0x588e8d0598e1bf7bc573291a34995fe43ad3c522",
      "couldn't add new Account"
    );
  });

  it("Should export account (privateKey)", async () => {
    const accounts = await evmController.getAccounts();

    const account = accounts[0];
    const privateKey = await evmController.exportAccount(account);
    assert(privateKey, "Failed to export account");
  });

  it("Should get accounts", async () => {
    const accounts = await evmController.getAccounts();
    assert(accounts.length > 0, "No accounts found");
  });

  it("Should initialize controller with different transaction types", () => {
    Object.entries(chainConfigs).forEach(([chainName, config]) => {
      const controllerOpts = { ...opts, txType: config.txType };
      const chainController = new KeyringController(controllerOpts);

      assert.strictEqual(
        chainController.txType,
        config.txType,
        `Incorrect txType for ${chainName}`
      );
    });
  });

  Object.entries(chainConfigs).forEach(([chainName, config]) => {
    describe(`${chainName.toUpperCase()} Specific Tests`, () => {
      let web3;
      let chainController;

      before(async () => {
        web3 = new Web3(NETWORKS[chainName].URL);
        chainController = new KeyringController({
          ...opts,
          txType: config.txType,
        });
        await chainController.createNewVaultAndKeychain(PASSWORD);
        await chainController.createNewVaultAndRestore(
          PASSWORD,
          HD_WALLET_12_MNEMONIC
        );
      });

      it(`Should get fees for ${chainName}`, async () => {
        const accounts = await chainController.getAccounts();

        const rawTx = {
          to: "0xca878f65d50caf80a84fb24e40f56ef05483e1cb",
          from: EXTERNAL_ACCOUNT_ADDRESS_TO_GET_FEE,
          value: web3.utils.numberToHex(web3.utils.toWei("0.00", "ether")),
          data: "0x00",
          chainId: NETWORKS[chainName].CHAIN_ID,
        };

        const response = await chainController.getFees(rawTx, web3);

        const fees = Object.keys(response.fees);
        const expectedFees = ["slow", "standard", "fast", "baseFee"];
        assert.deepEqual(
          fees,
          expectedFees,
          `${chainName} should have slow, standard, fast and base fee`
        );
      });

      it(`Should import correct account for ${chainName}`, async () => {
        const address = await chainController.importWallet(
          EXTERNAL_ACCOUNT_PRIVATE_KEY
        );
        assert(
          address.toLowerCase() === EXTERNAL_ACCOUNT_ADDRESS.toLowerCase(),
          `Wrong address for ${chainName}`
        );
      });

      it(`Should get address balance for ${chainName}`, async () => {
        const accounts = await chainController.getAccounts();

        const balance = await getBalance(accounts[0], web3);

        assert(balance !== undefined, `Failed to get balance for ${chainName}`);
      });

      it(`Should sign transaction for ${chainName}`, async () => {
        const accounts = await chainController.getAccounts();
        const from = accounts[0];
        const count = await web3.eth.getTransactionCount(from);
        const nonce = web3.utils.toHex(count);

        let rawTx = {
          to: "0xca878f65d50caf80a84fb24e40f56ef05483e1cb",
          from,
          value: web3.utils.numberToHex(web3.utils.toWei("0.01", "ether")),
          nonce,
          data: "0x00",
          chainId: NETWORKS[chainName].CHAIN_ID,
        };

        if (config.txType === 2) {
          rawTx = {
            ...rawTx,
            maxPriorityFeePerGas: web3.utils.numberToHex(
              web3.utils.toWei("1", "gwei")
            ),
            maxFeePerGas: web3.utils.numberToHex(
              web3.utils.toWei("20", "gwei")
            ),
            type: "0x2",
          };
        } else {
          rawTx.gasPrice = web3.utils.numberToHex(
            web3.utils.toWei("20", "gwei")
          );
        }

        const privateKey = await chainController.exportAccount(from);
        const signedTX = await chainController.signTransaction(
          rawTx,
          privateKey
        );
        assert(signedTX, `Failed to sign transaction for ${chainName}`);
      });
      it(`Should sign and verify Typed Message for ${chainName}`, async () => {
        const accounts = await chainController.getAccounts();

        // Ensure accounts is not empty
        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }

        // console.log(accounts[0]);

        let msgParams = {
          from: accounts[0],
          data: {
            types: {
              EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
              ],
              Person: [
                { name: "name", type: "string" },
                { name: "wallet", type: "address" },
              ],
              Mail: [
                { name: "from", type: "Person" },
                { name: "to", type: "Person" },
                { name: "contents", type: "string" },
              ],
            },
            primaryType: "Mail",
            domain: {
              name: "Ether Mail",
              version: "1",
              chainId: NETWORKS[chainName].CHAIN_ID,
              verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
            },
            message: {
              from: {
                name: "Cow",
                wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
              },
              to: {
                name: "Bob",
                wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
              },
              contents: "Hello, Bob!",
            },
          },
        };

        const rawSignature = await chainController.signTypedMessage(msgParams);
        // console.log("Raw signature:", rawSignature);

        // Verify the signature
        msgParams = { ...msgParams.data, from: msgParams.from };
        const recoveredAddress = sigUtil.recoverTypedSignature({
          data: msgParams,
          sig: rawSignature,
        });

        // console.log("Recovered address:", recoveredAddress);
        // console.log("Original address:", msgParams.from);

        // Compare the recovered address with the original signer's address
        const isSignatureValid =
          recoveredAddress.toLowerCase() === msgParams.from.toLowerCase();

        assert(
          isSignatureValid,
          `Signature verification failed for ${chainName}`
        );
        assert(rawSignature, `Failed to Sign Message for ${chainName}`);
      });

      it(`Should sign message using customPersonalSign for ${chainName}`, async () => {
        const accounts = await chainController.getAccounts();
        const message = `Hello, ${chainName}!`;

        const privateKey = await chainController.exportAccount(accounts[0]);
        const rawSign = chainController.customPersonalSign(
          "0x" + privateKey,
          message
        );

        assert(
          rawSign,
          `Failed to sign message using customPersonalSign for ${chainName}`
        );
      });

      it(`Should sign and verify Typed Message using customSignTypedMessage for ${chainName}`, async () => {
        const accounts = await chainController.getAccounts();

        const typedData = {
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Person: [
              { name: "name", type: "string" },
              { name: "wallet", type: "address" },
            ],
            Mail: [
              { name: "from", type: "Person" },
              { name: "to", type: "Person" },
              { name: "contents", type: "string" },
            ],
          },
          primaryType: "Mail",
          domain: {
            name: "Ether Mail",
            version: "1",
            chainId: NETWORKS[chainName].CHAIN_ID,
            verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
          },
          message: {
            from: {
              name: "Cow",
              wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
            },
            to: {
              name: "Bob",
              wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
            },
            contents: "Hello, Bob!",
          },
        };

        const privateKey = await chainController.exportAccount(accounts[0]);
        const rawSignature = chainController.customSignTypedMessage(
          "0x" + privateKey,
          typedData
        );

        const recoveredAddress = sigUtil.recoverTypedSignature({
          data: typedData,
          sig: rawSignature,
        });

        const isSignatureValid =
          recoveredAddress.toLowerCase() === accounts[0].toLowerCase();

        assert(
          isSignatureValid,
          `Signature verification failed using customSignTypedMessage for ${chainName}`
        );
        assert(rawSignature, `Failed to sign typed message for ${chainName}`);
      });
    });
  });
});
