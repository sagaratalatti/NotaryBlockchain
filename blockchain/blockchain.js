/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const levelDB = require('../data/levelDb');
const Block = require('./block');

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {

    constructor() {
        //Get block height from levelDB
        this.getBlockHeight().then(height => {
            //Check if block height is 0
            console.log('Height of Blockchain: ' + height);
            if (height === -1) {
                //Create the Genesis Block - The first block in the blockchain
                this.addBlock(
                    new Block('First block in the chain - Genesis block')
                ).then(() => console.log('Genesis Block created!'));
            }
        });
    }

    // Add new block
    async addBlock(newBlock){
        //Get block height from levelDB
        const height = await this.getBlockHeight();
        newBlock.height = height + 1;
        //Generate block timestamp
        newBlock.time = new Date().getTime().toString().slice(0, -3);
        //Check if the Block is not Genesis Block
        if (newBlock.height > 0) {
            //Get the block
            const prevBlock = await this.getBlock(height.toString());
            //Get previous block's hash
            newBlock.previousBlockHash = prevBlock.hash;
            console.log('Previous Hash: ' + newBlock.previousBlockHash)
        }
        //Generate hash for the new block.
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        console.log('Next Hash: ' + newBlock.hash);
        //Save the block created to levelDB
        await levelDB.addLevelDBBlock(newBlock.height.toString(), JSON.stringify(newBlock))
    };

    // Get block height
    async getBlockHeight(){
        //Return block height from levelDB
        return await levelDB.getLevelBlockHeight();
    };

    // get block
    async getBlock(blockHeight){
        //Return block data from levelDB
        return await levelDB.getLevelBlock(blockHeight);
    };

    // validate block
    async validateBlock(blockHeight){
        // Get block height from levelDB
        const block = await this.getBlock(blockHeight);
        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash === validBlockHash) {
            return true;
        } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+ validBlockHash);
            return false;
        }
    };

    // Validate blockchain
    async validateChain(){
        let errorLog = [];
        let chain = await this.getBlockHeight();
        for (let i = 0; i < chain.length-1; i++) {
            // validate block
            const validBlock = await this.validateBlock(i);
            if (!validBlock)errorLog.push(i);
            // compare blocks hash link
            let blockHash = await chain[i].hash;
            let previousHash = await chain[i+1].previousBlockHash;
            if (blockHash!==previousHash) {
                errorLog.push(i);
            }
        }
        if (errorLog.length > 0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: '+errorLog);
        } else {
            console.log('No errors detected');
        }
    };

    // Get block data by hash
    async getBlockByHash(hash){
        //Return block data by hash value from levelDB
        return await levelDB.getLevelBlockByHash(hash);
    };

    // Get blocks data by address
    async getBlocksByAddress(address){
        //Return blocks data by address from levelDB
        return await levelDB.getLevelBlocksByAddress(address);
    };
}

module.exports = Blockchain;