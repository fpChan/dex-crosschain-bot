// const ETH_NODE_URL= 'http://127.0.0.1:8545' //add your own api token
// const FORCE_BRIDGER_SERVER_URL = 'http://127.0.0.1:3003' //update to your force server url
// const NODE_URL = 'http://127.0.0.1:8114/' //update to your node url
// const signEthPrivateKey = '0xc4ad657963930fbff2e9de3404b30a4e21432c89952ed430b56bf802945ed37a' //update with your own private key
// const USER_ETH_ADDR = '0x17c4b5CE0605F63732bfd175feCe7aC6b4620FD2'//orig; bob:'0xBeB7C1d39B59DF17613F82AF0EC265565414d608'

// testnet
const NODE_URL= 'https://testnet.ckbapp.dev' //add your own api token
const CKB_INDEXER_URL= 'https://testnet.ckbapp.dev/indexer' //add your own api token
const FORCE_BRIDGER_SERVER_URL = 'http://127.0.0.1:3003' //update to your force server url
const ETH_NODE_URL = "https://ropsten.infura.io/v3/71c02c451b6248708e493c4ea007c3b2" //update to your node url
const signEthPrivateKey = '0xfa534931ed2dde878b474271c62af328bbf4bcfbbf0c6598862d3465d6b3ecb6' //update with your own private key
const USER_ETH_ADDR = '0x8a0F5A1724F73B67C7464b8a61C8c37C1f78B057'//orig; bob:'0xBeB7C1d39B59DF17613F82AF0EC265565414d608'
const RichPrivkey = "0xec7d9cbdaa76525af58a9d5efba4cc4ed820f8ed611c0f7a66789411ab8b50ea";


// const RichPrivkey = "0xa6b023fec4fc492c23c0e999ab03b01a6ca5524a3560725887a8de4362f9c9cc";
const unspentRichCells = [
    {
        lock: {
            codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hashType: "type",
            args: "0xafe0a2b3785bf631f19a31a4bfda90b0ddb07678",
        },
        outPoint: {
            txHash:
                "0x5edca2d744b6eaa347de7ff0edcd2e6e88ab8f2836bcbd0df0940026956e5f81",
            index: "0xc",
        },
        capacity: "0x1bc16d674ec80000",

        data: "0x",
    },
]



const ORDERBOOK_LOCK_CODEHASH = '0x279bee9fa98959029766c0e0ce19cd91b7180fd15b600a9e95140149b524c53b'
const ORDERBOOK_LOCK_TYPE = 'type'
const PW_LOCK_CODEHASH = '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63'
const PW_LOCK_HASHTYPE = 'type'


const userPWEthLock = {
    codeHash: PW_LOCK_CODEHASH,
    hashType: PW_LOCK_HASHTYPE,
    args: USER_ETH_ADDR,
};

// console.log("userEthCKBAddress: ", userEthCKBAddress)

const ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'
const DAI_TOKEN_ADDRESS = '0xC4401D8D5F05B958e6f1b884560F649CdDfD9615'
const USDT_TOKEN_ADDRESS = '0x1cf98d2a2f5b0BFc365EAb6Ae1913C275bE2618F'
const USDC_TOKEN_ADDRESS = '0x1F0D2251f51b88FaFc90f06F7022FF8d82154B1a'
let tokenAddress = ETH_TOKEN_ADDRESS
let udtDecimal;
let orderPrice;
let orderAmount;
switch (tokenAddress) {
    case ETH_TOKEN_ADDRESS:
        udtDecimal = 18n;
        orderPrice = 12988.55;
        orderAmount = 0.005;
        break;
    case DAI_TOKEN_ADDRESS:
        udtDecimal = 18n;
        orderPrice = 31.3;
        orderAmount = 1.5;
        break;
    case USDT_TOKEN_ADDRESS:
        udtDecimal = 6n;
        orderPrice = 43.66;
        orderAmount = 1;
        break;
    case USDC_TOKEN_ADDRESS:
        udtDecimal = 6n;
        orderPrice = 23.55;
        orderAmount = 1;
        break;
    default:
        tokenAddress = ETH_TOKEN_ADDRESS;
        udtDecimal = 18n;
        orderPrice = 12999.55;
        orderAmount = 0.004;
        break;
}


const bridgeFee = '0x0'
const isBid = false;

const recipientETHAddress = USER_ETH_ADDR
const unlockFee = "0x1"
const unlockAmount = "0x2"
const burnTxFee = "0.1"
const path = require('path')
const lumos_db_tmp = "lumos_db_tmp/"
const LUMOS_DB = path.join(lumos_db_tmp, 'lumos_db')

module.exports = {
    ETH_NODE_URL,
    FORCE_BRIDGER_SERVER_URL,
    NODE_URL,
    signEthPrivateKey,
    USER_ETH_ADDR,
    userPWEthLock,
    tokenAddress,
    udtDecimal,
    orderPrice,
    orderAmount,
    bridgeFee,
    isBid,
    unlockFee,
    unlockAmount,
    burnTxFee,
    ORDERBOOK_LOCK_CODEHASH,
    ORDERBOOK_LOCK_TYPE,
    recipientETHAddress,
    unspentRichCells,
    RichPrivkey,
    lumos_db_tmp,
    LUMOS_DB,
    CKB_INDEXER_URL,
}