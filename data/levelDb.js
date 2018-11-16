const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


module.exports = {

    //Saving blocks to LevelDB
    addLevelDBBlock : (key, value) => {
        return new Promise(function (resolve, reject){
            db.put(key, value, function (error){
                if(error){
                    reject(error);
                }
                resolve('Added block: ' + key);
                console.log('Added Block: ' + key);
            })
        })
    },

    //Getting blockchain height from levelDB
    getLevelBlockHeight : () => {
        return new Promise(function(resolve, reject){
            let height = -1;
            db.createReadStream()
                .on('data', function (data){
                    height++;
                })
                .on('error', function (error){
                    reject(error);
                })
                .on('close', function (){
                    resolve(height);
                })
        })
    },

    //Getting blocks data from levelDB
    getLevelBlock : (key) => {
        return new Promise(function (resolve, reject){
            db.get(key, function (error, value){
                if(error)
                    reject(error);
                resolve(JSON.parse(value));
            })
        })
    },

    getLevelBlockByHash : (hash) => {
        let block;
        return new Promise((resolve, reject) => {
            db.createReadStream().on('data', (data) => {
                block = JSON.parse(data.value);
                if (block.hash === hash) {
                    // Check if the block is not a Genesis Block
                    if (parseInt(data.key) !== 0) {
                        block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
                        return resolve(block)
                    } else {
                        return resolve(block)
                    }
                }
            }).on('error', (error) => {
                return reject(error)
            }).on('close', () => {
                return reject('Not found')
            })
        })
    },

    // Get Blocks data from LevelDb by Address request.
    getLevelBlocksByAddress : (address) => {
        const blocks = [];
        let block;
        return new Promise((resolve, reject) => {
            db.createReadStream().on('data', (data) => {
                // Check if the block is not a Genesis Block
                if (parseInt(data.key) !== 0) {
                    block = JSON.parse(data.value);
                    // Check if block address matches with the requested address.
                    if (block.body.address === address) {
                        block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
                        blocks.push(block)
                    }
                }
            }).on('error', (error) => {
                return reject(error)
            }).on('close', () => {
                return resolve(blocks)
            })
        })
    }
};