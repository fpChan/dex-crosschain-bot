const BufferParser = require("../utils/buffer");
const axios = require("axios");
const {
    FORCE_BRIDGER_SERVER_URL,
    USER_ETH_ADDR,
} = require("./params");

const getOrCreateBridgeCell = async (
    recipientCkbAddress,
    ethTokenAddress,
    bridgeFee,
    cellNum,
    retry = 0,
) => {
    try {
        const res = await axios.post(`${FORCE_BRIDGER_SERVER_URL}/get_or_create_bridge_cell`, {
            recipient_address: recipientCkbAddress,
            eth_token_address: ethTokenAddress,
            bridge_fee: bridgeFee,
            cell_num: cellNum,
        })
        return res
    } catch (error) {
        if (retry >= 5) {
            return Promise.resolve(Object.create({}))
        }
        // eslint-disable-next-line no-param-reassign
        retry += 1
        return getOrCreateBridgeCell(recipientCkbAddress, ethTokenAddress, bridgeFee, cellNum, retry)
    }
}

const placeCrossChainOrder = async (
    index, bridgeCells, udtDecimal,recipientAddress,
    marketPrice, orderAmount, isBid,
    tokenAddress,
    bridgeFee,
    gasPrice,
    nonce
) => {
    let ethAddress = USER_ETH_ADDR
    console.log("gasPrice, nonce: ", gasPrice, nonce)

    const sudtRelatedData = sudtExtraData(marketPrice, orderAmount, isBid, udtDecimal);
    const amount = BufferParser.toHexString(sudtRelatedData.payAmount)
    // let recipientAddress = recipientCKBAddress;
    // let op = bridgeCells[index]
    let sudtData = sudtRelatedData.orderData;

    const postData = {
        sender: ethAddress,
        token_address: tokenAddress,
        amount: BufferParser.toHexString(amount),
        bridge_fee: bridgeFee,
        ckb_recipient_address: recipientAddress,
        replay_resist_outpoint: "",
        sudt_extra_data: sudtData,
        gas_price: BufferParser.toHexString(gasPrice),
        nonce: BufferParser.toHexString(nonce),
    }
    // console.log("lock postData: ", JSON.stringify(postData))
    const res = await axios.post(`${FORCE_BRIDGER_SERVER_URL}/lock`, postData)
    return res
}

const parseIntPOW4 = (number) => {
    return BigInt(parseInt(number * 10 ** 4));
}

const sudtExtraData = (marketPrice, orderAmount, isBid, decimal) => {
    // console.log("marketPrice, orderAmount: ", marketPrice, orderAmount)
    let targetDecimal = BigInt(28) - decimal;

    let bidPrice = parseIntPOW4(marketPrice) * 10n ** targetDecimal / (10n ** 4n);
    let bidOrderAmount = parseIntPOW4(orderAmount) * 10n ** decimal / (10n ** 4n);
    let bidCKBAmount = parseIntPOW4(marketPrice) * parseIntPOW4(orderAmount) * 10n ** 8n / 10n ** 8n;
    let bidPayCKBAmount = bidCKBAmount + (bidCKBAmount * 3n / 1000n);

    let askPrice = parseIntPOW4(marketPrice) * 10n ** targetDecimal / (10n ** 4n);
    let askSUDTAmount = parseIntPOW4(orderAmount) * 10n ** decimal / (10n ** 4n); //doesn't include fee
    // the receive CKB amount for ask order
    let askOrderAmount = parseIntPOW4(orderAmount) * parseIntPOW4(marketPrice) * 10n ** 8n / (10n ** 8n);
    let askSUDTCurrentAmount = askSUDTAmount + (askSUDTAmount * 3n / 1000n); //include fee

    if (isBid) {
        return { payAmount: bidPayCKBAmount, orderData: formatOrderData(bidOrderAmount, bidPrice, true) };
    } else if (!isBid) {
        return { payAmount: askSUDTCurrentAmount, orderData: formatOrderData(askOrderAmount, askPrice, false) };
    }
}
const formatOrderData = (orderAmount, price, isBid) => {
    const orderAmountHex = BufferParser.writeBigUInt128LE(orderAmount).replace('0x', '');

    const priceHex = BufferParser.writeBigUInt128LE(price).replace('0x', '');

    const bidOrAskBuf = Buffer.alloc(1);
    bidOrAskBuf.writeInt8(isBid ? 0 : 1);
    const isBidHex = `${bidOrAskBuf.toString('hex')}`;

    const dataHex = orderAmountHex + priceHex + isBidHex;
    return dataHex;
};

module.exports= {
    placeCrossChainOrder,
    getOrCreateBridgeCell
}
