const ETH_NODE_URL= 'http://127.0.0.1:8545' //add your own api token
const FORCE_BRIDGER_SERVER_URL = 'http://127.0.0.1:3003' //update to your force server url
const NODE_URL = 'http://127.0.0.1:8114/' //update to your node url
const signEthPrivateKey = '0xc4ad657963930fbff2e9de3404b30a4e21432c89952ed430b56bf802945ed37a' //update with your own private key
const USER_ETH_ADDR = '0x17c4b5CE0605F63732bfd175feCe7aC6b4620FD2'//orig; bob:'0xBeB7C1d39B59DF17613F82AF0EC265565414d608'

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
const RichPrivkey = "0xa6b023fec4fc492c23c0e999ab03b01a6ca5524a3560725887a8de4362f9c9cc";
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
}