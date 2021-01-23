const {SDCollector} = require("./ckb_indexer");
const axios = require('axios')
const CKB = require('@nervosnetwork/ckb-sdk-core').default;
const Web3 = require('web3')
const { Indexer, CellCollector } = require('@ckb-lumos/indexer')
const {getOrCreateBridgeCell,placeCrossChainOrder,sleep,getLockStatus,getCrosschainHistory,getSudtBalance,getBestBlockHeight,initToken,getBurnStatus} = require("./method");
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
    lumos_db_tmp,
    // LUMOS_DB,
} = require("./params");

var fs = require('fs');
const {waitForIndexing,deleteAll} = require("./lumos");
const {} = require("./params");



const ckb = new CKB(NODE_URL);
const web3 = new Web3(ETH_NODE_URL);

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
    console.log("rich account : ",fromAddress)
    await ckb.loadDeps()
    let lock =    {
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: fromPublicKeyHash,
    }

    // const indexer = new Indexer(NODE_URL, LUMOS_DB)
    // await waitForIndexing( indexer,true,4* 60 * 1000)
    // const unspentCells = await ckb.loadCells({ indexer, CellCollector, lock })
    // indexer.stop()
    // deleteAll(lumos_db_tmp)

    const ckb_collect =  new SDCollector()
    const unspentCells = await ckb_collect.getCells(fromPublicKeyHash);
    console.log("unspentCells",unspentCells)

    let liveCells = []
    for (let i = 0; i < unspentCells.length; i++) {
        let res = await ckb.rpc.getLiveCell(unspentCells[i].outPoint,false);
        console.log("cell capacity: ",res.cell.output.capacity, " cell status: ", res.status)
        if(res.status === 'live') {
            liveCells.push(unspentCells[i])
        }
    }
    console.log("liveCells",liveCells)

    let tx = ckb.generateRawTransaction({
        fromAddress,
        toAddress: "ckt1qyqvsv5240xeh85wvnau2eky8pwrhh4jr8ts8vyj37",
        capacity: BigInt(15000_00000000),
        fee: BigInt(100000),
        safeMode: true,
        cells: liveCells,
        deps: [ckb.config.secp256k1Dep],
    });
    let restCapacity = BigInt(0);
    for (let i = 0; i < tx.outputs.length; i++) {
        restCapacity = BigInt(tx.outputs[i].capacity) + restCapacity
    }
    console.log("restCapacity: ",restCapacity)
    tx.outputs.splice(0,   tx.outputs.length);
    tx.outputsData.splice(0,   tx.outputsData.length);
    let capacity = BigInt( 1000_00000000);
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



const batchLockToken = async (recipientCKBAddress, cellNum, nonce) => {
    // bridge has been created
    // let get_res = await getOrCreateBridgeCell(recipientCKBAddress, tokenAddress, bridgeFee, cellNum);
    // let bridgeCells = [...get_res.data.outpoints];
    // console.log("bridgeCells",bridgeCells);

    const gasPrice = await web3.eth.getGasPrice()
    const send_with_outpoint = async (index) => {
        const txFromBridge = await placeCrossChainOrder(index, "", udtDecimal, recipientCKBAddress, orderPrice, orderAmount, isBid, tokenAddress, bridgeFee, gasPrice, nonce + index);
        const res = await web3.eth.accounts.signTransaction(txFromBridge.data, signEthPrivateKey);
        const rawTX = res.rawTransaction;
        const receipt = await web3.eth.sendSignedTransaction(rawTX);
        if (!receipt.status) {
            console.error("failed to lock tx hash : ",txHash)
        }
        // await sleep( 90 * 1000);
        let txHash =receipt.transactionHash;

        if(txHash.indexOf("0x") === 0){
            txHash = txHash.substring(2)
        }
        await getLockStatus(txHash)
        return txHash;
    }

    let futures = [];
    for (let index = 0; index < cellNum; index++) {
        let fut = send_with_outpoint(index);
        futures.push(fut);
    }
    const crosschainTxHashes = await Promise.all(futures);
    // console.log("lock hashes ", crosschainTxHashes);

    return crosschainTxHashes;
}

const batchMintToken = async (crosschainTxHashes) => {
    await Promise.all(crosschainTxHashes.map(txHash => relayEthToCKB(txHash)));
}



const burnToken = async (privkey, txFee, unlockFee, amount, tokenAddress, recipientAddress) => {
    const ckb_client = new CKB(NODE_URL);
    const addr = ckb_client.utils.privateKeyToAddress(privkey, {prefix: 'ckt'})
    if(tokenAddress.indexOf("0x") === 0){
        tokenAddress = tokenAddress.substring(2)
    }
    const postData = {
        from_lockscript_addr: addr,
        tx_fee: txFee,
        unlock_fee: unlockFee,
        amount: amount,
        token_address: tokenAddress,
        recipient_address: recipientAddress,
    }

    console.log("burn postData: ", JSON.stringify(postData))
    let res;
    while(res === "" || res === undefined || res == null) {
        try{
            res = await axios.post(`${FORCE_BRIDGER_SERVER_URL}/burn`, postData, {timeout: 1000 * 60 * 5})
        } catch(error){
            console.error("failed to post burn interface: ",error.response.status,error.response.statusText)
        }
        await sleep(10*1000)
    }
    const rawTx = ckb_client.rpc.resultFormatter.toTransaction(res.data.raw_tx)

    rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : {
        lock: '',
        inputType: '',
        outputType: '',
    }));

    const signedTx = ckb_client.signTransaction(privkey)(rawTx)
    delete signedTx.hash
    let txHash = await ckb_client.rpc.sendTransaction(signedTx)
    if(txHash.indexOf("0x") === 0){
        txHash = txHash.substring(2)
    }
    await getBurnStatus(txHash)
    return txHash
}

const batchBurnToken = async (burnPrivkeys) => {
    await prepareAccounts(RichPrivkey,burnPrivkeys)
    await initToken(tokenAddress)

    console.error("*************************************      start lock      ***************************************");
    let nonce = await web3.eth.getTransactionCount(USER_ETH_ADDR)
    console.log("start nonce :", nonce);
    const cellNum = 1
    let lockFutures = [];
    for (let i = 0; i < burnPrivkeys.length; i++) {
        const addr = ckb.utils.privateKeyToAddress(burnPrivkeys[i], {prefix: 'ckt'})
        let lockFut = batchLockToken(addr, cellNum, nonce);
        lockFutures.push(lockFut);
        nonce = nonce + cellNum;
    }
    const lockHashes = await Promise.all(lockFutures);
    console.log("lock hashes ", lockHashes);
    console.log("****************** end lock , please wait 3 mintue to relay lock proof and relay *******************");
    // await batchMintToken(waitMintTxs);
    // wait relay the lock tx proof to CKB

    for (let i = 0; i < burnPrivkeys.length; i++) {
        const addr = ckb.utils.privateKeyToAddress(burnPrivkeys[i], {prefix: 'ckt'})
        await getSudtBalance(addr, tokenAddress)
    }

    console.log("**********************************        start burn sudt        ***********************************");
    // burn those account sudt
    let burnFutures = [];
    for (let i = 0; i < burnPrivkeys.length; i++) {
        let burnFut = burnToken(burnPrivkeys[i], burnTxFee, unlockFee, unlockAmount, tokenAddress, recipientETHAddress);
        burnFutures.push(burnFut);
    }
    const burnHashes = await Promise.all(burnFutures);
    console.log("burn hashes ", burnHashes);
    console.log("***********************************   end burn and start test interface    ********************************");

    await getBestBlockHeight()
    await getCrosschainHistory(recipientETHAddress.toLowerCase())

    console.log("***********************************   end test interface    ********************************");
}

async function main() {
    const concurrency_number = 2
    const burnPrivkeys = generateWallets(concurrency_number);
    fs.writeFileSync(
        'burnPrivkeys',
        JSON.stringify(burnPrivkeys, null, 2)
    );
    console.log("generate keys",burnPrivkeys)
    await batchBurnToken(burnPrivkeys);

}

main();
