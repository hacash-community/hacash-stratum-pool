var merkleTree = require('./merkleTree.js');
var transactions = require('./transactions.js');
var util = require('./util.js');

/**
 * The BlockTemplate class holds a single job.
 * and provides several methods to validate and submit it to the daemon coin
**/
var BlockTemplate = module.exports = function BlockTemplate(jobId, rpcData, poolAddressScript, extraNoncePlaceholder, reward, txMessages, network) {

    // private members
    var submits = [];

    function getMerkleHashes(steps) {
        return steps.map(function (step) {
            return step.toString('hex');
        });
    }

    function getTransactionBuffers(txs) {
        var txHashes = txs.map(function (tx) {
            if (tx.txid !== undefined) {
                return util.uint256BufferFromHash(tx.txid);
            }
            return util.uint256BufferFromHash(tx.hash);
        });
        return [null].concat(txHashes);
    }

    // public members
    this.rpcData = rpcData;
    this.jobId = jobId;

    this.height = rpcData.height;
    this.rpcData.curtime = Math.floor(Date.now() / 1000);
    this.target = util.bignumFromBuffer(Buffer.from(rpcData.target_hash, 'hex'));
    this.difficulty = parseFloat((diff1/Number(this.target)).toFixed(9));
    this.prevHashReversed = Buffer.from(rpcData.prevhash, 'hex').toString('hex');
    this.bits = Buffer.from(rpcData.block_intro, 'hex').toString('hex').slice(166, 174);
    this.transactionData = [];
    this.merkleTree = Buffer.from(util.sha3(rpcData.transaction_body_list[0]), 'hex');
    this.generationTransaction = transactions.CreateGeneration(
        rpcData,
        extraNoncePlaceholder
    );

    this.serializeCoinbase = function (extraNonce1, extraNonce2) {
        return Buffer.concat([
            Buffer.from(this.generationTransaction[0], 'hex'),
            extraNonce1,
            extraNonce2,
            Buffer.from(this.generationTransaction[1], 'hex')
        ]);
    };

    // https://en.bitcoin.it/wiki/Protocol_specification#Block_Headers
    this.serializeHeader = function (merkleRoot, nTime, nonce) {
        var headerSize = 89;
        var header = Buffer.alloc(headerSize);
        var position = 0;
        header.write("01", position, 1, 'hex');
        header.write("00", position += 1, 1, 'hex');
        header.write(util.packUInt32BE(this.rpcData.height).toString('hex'), position += 1, 4, 'hex');
        header.write("00", position += 4, 1, 'hex');
        header.write(nTime, position += 1, 4, 'hex');
        header.write(rpcData.prevhash, position += 4, 32, 'hex');
        header.write(merkleRoot.toString('hex'), position += 32, 32, 'hex');
        header.write("00000001", position += 32, 4, 'hex');
        header.write(nonce, position += 4, 4, 'hex');
        header.write(this.bits.toString('hex'), position += 4, 4, 'hex');
        header.write("0000", position += 4, 2, 'hex');
        return header;
    };

    this.serializeBlock = function (header, coinbase) {
        return Buffer.concat([
            header,
            coinbase
        ]);
    };

    this.registerSubmit = function (extraNonce1, extraNonce2, nTime, nonce) {
        var submission = extraNonce1 + extraNonce2 + nTime + nonce;
        if (submits.indexOf(submission) === -1) {
            submits.push(submission);
            return true;
        }
        return false;
    };

    this.getOdoKey = function () {
        if (this.rpcData && this.rpcData.odokey !== undefined) {
            return this.rpcData.odokey;
        }
        return null;
    };

    this.getJobParams = function () {
        if (!this.jobParams) {
            this.jobParams = [
                this.jobId,
                this.prevHashReversed,
                this.generationTransaction[0].toString('hex'),
                this.generationTransaction[1].toString('hex'),
                !this.merkleBranch ? [] : this.merkleBranch,
                util.packInt32BE(this.rpcData.version).toString('hex'),
                this.bits,
                util.packUInt32BE(this.rpcData.curtime).toString('hex'),
                this.height,
                true
            ];
        }
        return this.jobParams;
    };
};
