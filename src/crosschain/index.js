const path = require('path')
const os = require('os')
const axios = require('axios')
const CKB = require('@nervosnetwork/ckb-sdk-core').default;
const Web3 = require('web3')
const { Indexer, CellCollector } = require('@ckb-lumos/indexer')
const {getOrCreateBridgeCell,placeCrossChainOrder} = require("./method");
const {
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
} = require("./params");

var fs = require('fs');

function deleteall(path) {
    var files = [];
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

const ckb = new CKB(NODE_URL);
const web3 = new Web3(ETH_NODE_URL);
const lumos_db_tmp = "lumos_db_tmp/"
const LUMOS_DB = path.join(lumos_db_tmp, 'lumos_db')
const indexer = new Indexer(NODE_URL, LUMOS_DB)


// const userPWEthLockHash = ckb.utils.scriptToHash(userPWEthLock);
// console.log("userPWEthLockHash: ", userPWEthLockHash);

// const userEthCKBAddress = ckb.utils.fullPayloadToAddress({
//     args: userPWEthLockHash,
//     type: ORDERBOOK_LOCK_TYPE == "type" ? ckb.utils.AddressType.TypeCodeHash : ckb.utils.AddressType.DataCodeHash,
//     prefix: ckb.utils.AddressPrefix.Testnet,
//     codeHash: ORDERBOOK_LOCK_CODEHASH,
// })

const generateWallets = (size) => {
    const privkeys = [];
    for (let i = 0; i < size; i++) {
        const wallet = web3.eth.accounts.create();
        privkeys.push(wallet.privateKey)
    }
    return privkeys;
}


const batchLockToken = async (recipientCKBAddress, cellNum) => {
    // bridge has been created
    // let get_res = await getOrCreateBridgeCell(recipientCKBAddress, tokenAddress, bridgeFee, cellNum);
    let bridgeCells = [...get_res.data.outpoints];
    console.log("bridgeCells",bridgeCells);

    const gasPrice = await web3.eth.getGasPrice()
    const nonce = await web3.eth.getTransactionCount(USER_ETH_ADDR)
    const send_with_outpoint = async (index) => {
        const txFromBridge = await placeCrossChainOrder(index, "", udtDecimal, recipientCKBAddress, orderPrice, orderAmount, isBid, tokenAddress, bridgeFee, gasPrice, nonce + index);
        const res = await web3.eth.accounts.signTransaction(txFromBridge.data, signEthPrivateKey);
        const rawTX = res.rawTransaction;
        const txHash = res.transactionHash;
        const receipt = await web3.eth.sendSignedTransaction(rawTX);
        return txHash;
    }

    let futures = [];
    for (let index = 0; index < bridgeCells.length; index++) {
        let fut = send_with_outpoint(index);
        futures.push(fut);
    }
    const crosschainTxHashes = await Promise.all(futures);
    console.log("lock hashes ", crosschainTxHashes);

    return crosschainTxHashes;
}

const batchMintToken = async (crosschainTxHashes) => {
    await Promise.all(crosschainTxHashes.map(txHash => relayEthToCKB(txHash)));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const burnToken = async (privkey, txFee, unlockFee, amount, tokenAddress, recipientAddress) => {
    const addr = ckb.utils.privateKeyToAddress(privkey, {prefix: 'ckt'})
    const postData = {
        from_lockscript_addr: addr,
        tx_fee: txFee,
        unlock_fee: unlockFee,
        amount: amount,
        token_address: tokenAddress,
        recipient_address: recipientAddress,
    }

    console.log("burn postData: ", JSON.stringify(postData))
    const res = await axios.post(`${FORCE_BRIDGER_SERVER_URL}/burn`, postData);
    const rawTx = ckb.rpc.resultFormatter.toTransaction(res.data.raw_tx)

    rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : {
        lock: '',
        inputType: '',
        outputType: '',
    }));

    const signedTx = ckb.signTransaction(privkey)(rawTx)
    delete signedTx.hash
    const txHash = await ckb.rpc.sendTransaction(signedTx)
    return txHash
}

const batchBurnToken = async (burnPrivkeys) => {
    // prepare account which have enough sudt to burn
    await prepareAccounts(RichPrivkey,burnPrivkeys)

    console.error("start lock to prepare account which have enough sudt to burn ");
    let waitMintTxs = [];
    for (let i = 0; i < burnPrivkeys.length; i++) {

        // for(let privkey of burnPrivkeys) {
        const addr = ckb.utils.privateKeyToAddress(burnPrivkeys[i], {prefix: 'ckt'})
        console.log("receive ckb sudt addr :", i, addr);
        let txs = await batchLockToken(addr, 1);
        waitMintTxs.push.apply(waitMintTxs, txs);
    }
    console.log("end lock which prepare some account, please wait 4 mintue");
    // await batchMintToken(waitMintTxs);
    // wait relay the lock tx proof to CKB
    await sleep(4 * 60 * 1000);
    console.log("start burn which burn those sudt");
    // burn those account sudt
    let burnFutures = [];
    for (let i = 0; i < burnPrivkeys.length; i++) {
        let burnFut = burnToken(burnPrivkeys[i], burnTxFee, unlockFee, unlockAmount, tokenAddress, recipientETHAddress);
        burnFutures.push(burnFut);
    }
    const burnHashes = await Promise.all(burnFutures);
    console.log("burn hashes ", burnHashes);
    console.log("end burn");
}

const prepareBridgeCells = async (privkeys,cellNum) => {
    let createFutures = [];
    for (let i = 0; i < privkeys.length; i++) {
        const addr = ckb.utils.privateKeyToAddress(privkeys[i], {prefix: 'ckt'})

        let createFut = getOrCreateBridgeCell(addr, tokenAddress, bridgeFee, cellNum);
        createFutures.push(createFut);
    }
    const createOutpoints = await Promise.all(createFutures);
    console.log("create bridge outpoints",createOutpoints.map((res) => { return res.data.outpoints ;}))
}


const prepareAccounts = async (fromPrivkey, toPrivkeys) => {
    const fromAddress = ckb.utils.privateKeyToAddress(fromPrivkey, {prefix: 'ckt'})
    const fromPublicKey = ckb.utils.privateKeyToPublicKey(fromPrivkey)
    const fromPublicKeyHash = `0x${ckb.utils.blake160(fromPublicKey, 'hex')}`

    // await indexer.startForever()
    await ckb.loadDeps()
    let lock =    {
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: fromPublicKeyHash,
    }
    const unspentCells = await ckb.loadCells({ indexer, CellCollector, lock })
    let liveCells = []
    for (let i = 0; i < unspentCells.length; i++) {
        let res = await ckb.rpc.getLiveCell(unspentCells[i].outPoint,false);
        console.log(unspentCells[i].capacity, res.status)
        if(res.status === 'live') {
            liveCells.push(unspentCells[i])
        }
    }
    console.log("liveCells",liveCells)
    console.log(fromAddress)

    let tx = ckb.generateRawTransaction({
        fromAddress,
        toAddress: "ckt1qyqvsv5240xeh85wvnau2eky8pwrhh4jr8ts8vyj37",
        capacity: BigInt(1500000000000),
        fee: BigInt(100000),
        safeMode: true,
        cells: liveCells,
        deps: [ckb.config.secp256k1Dep],
    });
    let restCapacity = BigInt(0);
    for (let i = 0; i < tx.outputs.length; i++) {
        restCapacity = BigInt(tx.outputs[i].capacity) + restCapacity
    }
    console.log("restCapacity",restCapacity)
    tx.outputs.splice(0,   tx.outputs.length);
    tx.outputsData.splice(0,   tx.outputsData.length);
    let capacity = BigInt( 150000000000);
    for (let i = 0; i < toPrivkeys.length; i++) {
        // const addr = ckb.utils.privateKeyToAddress(toPrivkeys[i], {prefix: 'ckt'})
        const publicKey = ckb.utils.privateKeyToPublicKey(toPrivkeys[i])
        const publicKeyHash = `0x${ckb.utils.blake160(publicKey, 'hex')}`
        let output = {
            capacity: "0x"+capacity.toString(16),
            lock:  {
                codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                hashType: "type",
                args: publicKeyHash
            },
            type: null,
        };
        tx.outputs.push(output)
        tx.outputsData.push("0x");
    }
    let output = {
        capacity: "0x"+(restCapacity - capacity * BigInt(toPrivkeys.length)).toString(16),
        lock:  {
            codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hashType: "type",
            args: fromPublicKeyHash
        },
        type: null,
    };
    tx.outputs.push(output)
    tx.outputsData.push("0x");
    tx.witnesses = tx.inputs.map((_, i) => (i > 0 ? '0x' : {
        lock: '',
        inputType: '',
        outputType: '',
    }));
    const signedTx = ckb.signTransaction(fromPrivkey)(tx)
    // console.log(JSON.stringify(signedTx, null, 2))
    const txHash = await ckb.rpc.sendTransaction(signedTx)
    console.log("prepare account tx hash",txHash)
}

async function main() {
    indexer.startForever()
    const concurrency_number = 40
    const burnPrivkeys = generateWallets(concurrency_number);
    console.log(burnPrivkeys)
    await batchBurnToken(burnPrivkeys);
    indexer.stop()
    deleteall(lumos_db_tmp)
}

main();