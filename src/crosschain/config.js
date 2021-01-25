// testnet config
const NODE_URL= 'https://testnet.ckbapp.dev' // https://testnet.ckbapp.dev
const CKB_INDEXER_URL= 'https://testnet.ckbapp.dev/indexer' //https://testnet.ckbapp.dev/indexer
const FORCE_BRIDGER_SERVER_URL = 'http://127.0.0.1:3003' //update to your force server url
const ETH_NODE_URL = "https://ropsten.infura.io/v3/71c02c451b6248708e493c4ea007c3b2" //update to your node url
const RichCKBPrivkey = "0x11429452ecc210812bf2ded107f500e9d6f6191334a2b2aeae61dafa30cfd7e0"; //CKB Testnet Rich
const RichETHPrivkey = '0xfa534931ed2dde878b474271c62af328bbf4bcfbbf0c6598862d3465d6b3ecb6' // ETH Ropsten Rich
const recipientETHAddress = "0x8a0F5A1724F73B67C7464b8a61C8c37C1f78B057" // RichETHPrivkey： 0xfa534931ed2dde878b474271c62af328bbf4bcfbbf0c6598862d3465d6b3ecb6

// backup privkeys ckb
//0xb22b07bb70663b6949d63d46f635a18fe5fbb28698f85936113e894e6190147a
//0xec7d9cbdaa76525af58a9d5efba4cc4ed820f8ed611c0f7a66789411ab8b50ea

const ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'
// Test config
const DAI_TOKEN_ADDRESS = '0xC4401D8D5F05B958e6f1b884560F649CdDfD9615'
const USDT_TOKEN_ADDRESS = '0x1cf98d2a2f5b0BFc365EAb6Ae1913C275bE2618F'
const USDC_TOKEN_ADDRESS = '0x1F0D2251f51b88FaFc90f06F7022FF8d82154B1a'
const TokenLockerAddress = '0x4347818B33aaf0b442A977900585B9ad1e1B581F'

// lock params
const bridgeFee = '0x0'
const isBid = false;

// unlock params
const unlockFee = "0x1"
const unlockAmount = "0x2"
const burnTxFee = "0.1"


const ORDERBOOK_LOCK_CODEHASH = '0x279bee9fa98959029766c0e0ce19cd91b7180fd15b600a9e95140149b524c53b'
const ORDERBOOK_LOCK_TYPE = 'type'
const PW_LOCK_CODEHASH = '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63'
const PW_LOCK_HASHTYPE = 'type'


const userPWEthLock = {
    codeHash: PW_LOCK_CODEHASH,
    hashType: PW_LOCK_HASHTYPE,
    args: recipientETHAddress,
};

const lumos_db_tmp = "lumos_db_tmp/"
// const path = require('path')
// const LUMOS_DB = path.join(lumos_db_tmp, 'lumos_db')
const LUMOS_DB = ""

module.exports = {
    ETH_NODE_URL,
    FORCE_BRIDGER_SERVER_URL,
    NODE_URL,
    RichETHPrivkey,
    userPWEthLock,
    bridgeFee,
    isBid,
    unlockFee,
    unlockAmount,
    burnTxFee,
    ORDERBOOK_LOCK_CODEHASH,
    ORDERBOOK_LOCK_TYPE,
    recipientETHAddress,
    RichCKBPrivkey,
    lumos_db_tmp,
    LUMOS_DB,
    CKB_INDEXER_URL,
    DAI_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    USDC_TOKEN_ADDRESS,
    ETH_TOKEN_ADDRESS,
    TokenLockerAddress,
}