const {
    Collector,
    Amount,
    Cell,
    Script,
    OutPoint,
    AmountUnit,
} = require("@lay2/pw-core");
const {CKB_INDEXER_URL} = require("./params");
const {getTipBlockNumber} = require("./lumos");
const axios = require('axios')

class SDCollector extends Collector {
    indexerUrl = CKB_INDEXER_URL;

    async getParams(address) {

    }

    constructor() {
        super();
    }

    async getCells(address) {
        this.cells = [];

        const { data: { result: nodeTipBlockNumber } } = await getTipBlockNumber();
        let postData = {
            id: 2,
            jsonrpc: "2.0",
            method: "get_cells",
            params: [
                {
                    script: address.toLockScript().serializeJson(),
                    script_type: "lock",
                },
                "asc",
                nodeTipBlockNumber,
            ],
        }
        // const res = await (
        //     await fetch(this.indexerUrl, {
        //         method: "POST",
        //         body: JSON.stringify(),
        //         cache: "no-store",
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //         mode: "cors",
        //     })
        // ).json();
         await this.getParams(address);
        const res = await axios.post(this.indexerUrl,postData);
        console.log("inderer post response", res )
        const rawCells = res.data;

        for (let rawCell of rawCells) {
            const cell = new Cell(
                new Amount(rawCell.output.capacity, AmountUnit.shannon),
                Script.fromRPC(rawCell.output.lock),
                Script.fromRPC(rawCell.output.type),
                OutPoint.fromRPC(rawCell.out_point),
                rawCell.output_data
            );

            this.cells.push(cell);
        }
        return this.cells;
    }

    async getBalance(address) {
        const cells = await this.getCells(address);
        if (!cells.length) return Amount.ZERO;
        return cells
            .map((c) => c.capacity)
            .reduce((sum, cap) => (sum = sum.add(cap)));
    }

    async collect(address, { withData }) {
        const cells = await this.getCells(address);

        if (withData) {
            return cells.filter((c) => !c.isEmpty() && !c.type);
        }

        return cells.filter((c) => c.isEmpty() && !c.type);
    }
}
module.exports={
    SDCollector
}