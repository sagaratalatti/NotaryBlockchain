const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Block = require('./blockchain/block');
const Blockchain = require('./blockchain/blockchain');
const blockchain = new Blockchain();
const StarValidation = require('./validation/starValidation');
const compression = require('compression');

    //  Address Validation for star notarization.
    validateAddressParameter = async (req, res, next) => {
        try {
            const starValidation = new StarValidation(req);
            starValidation.validateAddressParameter();
            next()
        } catch (error) {
            res.status(400).json({
                status: 400,
                message: error.message
            })
        }
    };

    // Signature validation for star notarization.
    validateSignatureParameter = async (req, res, next) => {
        try {
            const starValidation = new StarValidation(req);
            starValidation.validateSignatureParameter();
            next()
        } catch (error) {
            res.status(400).json({
                status: 400,
                message: error.message
            })
        }
    };

    // New Star validation request.
    validateNewStarRequest = async (req, res, next) => {
        try {
            const starValidation = new StarValidation(req);
            starValidation.validateNewStarRequest();
            next()
        } catch (error) {
            res.status(400).json({
                status: 400,
                message: error.message
            })
        }
    };

    app.use(compression());
    app.listen(8000, () => console.log('API deployed to port 8000'));
    app.use(bodyParser.json());
    app.get('/', (req, res) => res.status(404).json({
        status: 404,
        message: 'Welcome to Star Notarization Service.'
    }));

    // Create new request for Star Validation with address.
    app.post('/requestValidation', [validateAddressParameter], async (req, res) => {
        const starValidation = new StarValidation(req);
        const address = req.body.address;

        let data;
        try {
            // Check if notarization request is pending for the requested address.
            data = await starValidation.getPendingAddressRequest(address)
        } catch (error) {
            // Create new request for star notarization
            data = await starValidation.saveNewRequestValidation(address)
        }

        res.json(data)
    });

    // Validate signed message with address and signature.
    app.post('/message-signature/validate', [validateAddressParameter, validateSignatureParameter], async (req, res) => {
        const starValidation = new StarValidation(req);

        try {
            const { address, signature } = req.body;
            const response = await starValidation.validateMessageSignature(address, signature);

            if (response.registerStar) {
                res.json(response)
            } else {
                res.status(401).json(response)
            }
        } catch (error) {
            res.status(404).json({
                status: 404,
                message: error.message
            })
        }
    });

    // Request new Star Validation
    app.post('/block', [validateNewStarRequest], async (req, res) => {
        const starValidation = new StarValidation(req);
        // Check if signature is valid or invalid.
        try {
            const isValid = await starValidation.isValid();

            if (!isValid) throw new Error('Signature is not valid')
        } catch (error) {
            res.status(401).json({
                status: 401,
                message: error.message
            });

            return
        }

        const body = { address, star } = req.body;
        const story = star.story;
        // Star JSON
        body.star = {
            ra: star.ra,
            dec: star.dec,
            mag: star.mag,
            con: star.con,
            story: new Buffer(story).toString('hex')
        };
        // Save Star information to LevelDb.
        await blockchain.addBlock(new Block(body));
        // Get current block height.
        const height = await blockchain.getBlockHeight();
        // Retrieve current saved Star block with height.
        const response = await blockchain.getBlock(height);
        // Delete block from Star database by address.
        starValidation.invalidate(address);
        res.status(201).send(response)
    });

    // Get Star Block by block height
    app.get('/block/:height', async (req, res) => {
        try {
            // Retrieve block from LevelDb by height
            const response = await blockchain.getBlock(req.params.height);

            res.send(response)
        } catch (error) {
            res.status(404).json({
                status: 404,
                message: 'Oops! No Block found for the given height.'
            })
        }
    });

    // Get Star Block by address
    app.get('/stars/address:address', async (req, res) => {
        try {
            // Remove colon before address.
            const address = req.params.address.slice(1);
            // Retrieve block from LevelDB by address.
            const response = await blockchain.getBlocksByAddress(address);

            res.send(response)
        } catch (error) {
            res.status(404).json({
                status: 404,
                message: 'Oops! No Block found for the given address.'
            })
        }
    });


    // Get Star block by hash value
    app.get('/stars/hash:hash', async (req, res) => {
        try {
            // Remove colon before hash
            const hash = req.params.hash.slice(1);
            // Retrieve Block from LevelDb with hash value.
            const response = await blockchain.getBlockByHash(hash);

            res.send(response)
        } catch (error) {
            res.status(404).json({
                status: 404,
                message: 'Oops! No Block found for the Hash Value'
            })
        }
    });