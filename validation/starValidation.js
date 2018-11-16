const db = require('level')('./data/star');
const bitcoinMessage = require('bitcoinjs-message');

/* ===== Star Validation Class ==========================
|  Class with a constructor for new request for Star Validation|
  ================================================*/

class StarValidation {

    constructor (req) {
        //Receive new request for validation.
        this.req = req
    }

    validateAddressParameter () {
        //Check if Address parameter is not empty.
        if (!this.req.body.address) {
            //if Address parameter is empty throw error.
            throw new Error('Fill the address parameter')
        }
        return true
    }

    validateSignatureParameter () {
        if (!this.req.body.signature) {
            throw new Error('Fill the signature parameter')
        }
    }

    validateNewStarRequest () {
        // Star story supports text limited to 250 words (500 bytes),
        const MAX_STORY_BYTES = 500;
        // Retrieve star JSON from the request.
        const { star } = this.req.body;
        // Star co-ordinates in the sky. RA = Right Ascension, DEC = Declination, MAG = Magnitude & Story.
        const { ra, dec, mag, con, story } = star;

        //Check if the requested address is not empty.
        if (!this.validateAddressParameter() || !this.req.body.star) {
            throw new Error('Fill the address and star parameters')
        }

        //Check if star co-ordinates are non-empty string properties
        if (typeof ra !== 'string' || typeof dec !== 'string' || typeof mag !== 'string' || typeof  con !== 'string' ||
            typeof story !== 'string' || !ra.length || !dec.length || !mag.length || !con.length || !story.length) {
            throw new Error("Your star information should include non-empty string properties for 'ra', 'dec', 'mag', 'con' and 'story'")
        }

        //Check if story meets the criteria for 500 bytes.
        if (new Buffer(story).length > MAX_STORY_BYTES) {
            throw new Error('Your star story too is long. Maximum size is 500 bytes')
        }

        //ASCII format function
        const isASCII = (str) => /^[\x00-\x7F]*$/.test(str);

        //Check if story contains ASCII text only.
        if (!isASCII(story)) {
            throw new Error('Your star story contains non-ASCII symbols')
        }
    }

    // Check if the signature is valid for the requested address.
    isValid () {
        return db.get(this.req.body.address)
            .then((value) => {
                value = JSON.parse(value);
                return value.messageSignature === 'valid'
            }) //If not validated throw error
            .catch(() => { throw new Error('Not authorized') })
    }

    // Remove the address
    invalidate (address) {
        db.del(address)
    }

    // Validating Message Signature with the requested Address.
    async validateMessageSignature (address, signature) {
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (value === undefined) {
                    // Throw error if the address is not found.
                    return reject(new Error('Not found'))
                } else if (error) {
                    return reject(error)
                }

                value = JSON.parse(value);
                // If address has been signed return true.
                if (value.messageSignature === 'valid') {
                    return resolve({
                        registerStar: true,
                        status: value
                    })
                } else {
                    // Get time period of 5 minutes from the current time.
                    const fiveMinutes = Date.now() - (5 * 60 * 1000);
                    // Check if the validation time period has expired.
                    const isExpired = value.requestTimeStamp < fiveMinutes;

                    let isValid = false;
                    // If the validation period is over
                    if (isExpired) {
                        value.validationWindow = 0;
                        value.messageSignature = 'Validation window was expired'
                    } else {
                        // Show validation period countdown.
                        value.validationWindow = Math.floor((value.requestTimeStamp - fiveMinutes) / 1000);

                        try {
                            // Verify message with address & signature using bitcoin-js
                            isValid = bitcoinMessage.verify(value.message, address, signature)
                        } catch (error) {
                            // Validation failed
                            isValid = false
                        }

                        value.messageSignature = isValid ? 'valid' : 'invalid'
                    }

                    db.put(address, JSON.stringify(value));

                    return resolve({
                        registerStar: !isExpired && isValid,
                        status: value
                    })
                }
            })
        })
    }

    // Save New Validation Request to Blockchain
    saveNewRequestValidation (address) {
        const timestamp = Date.now();
        // Saving message:  [walletAddress]:[timeStamp]:starRegistry
        const message = `${address}:${timestamp}:starRegistry`;
        const validationWindow = 300;

        const data = {
            address: address,
            message: message,
            requestTimeStamp: timestamp,
            validationWindow: validationWindow
        };

        db.put(data.address, JSON.stringify(data));

        return data
    }

    async getPendingAddressRequest (address) {
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (value === undefined) {
                    return reject(new Error('Not found'))
                } else if (error) {
                    return reject(error)
                }

                value = JSON.parse(value);

                const nowSubFiveMinutes = Date.now() - (5 * 60 * 1000);
                const isExpired = value.requestTimeStamp < nowSubFiveMinutes;

                if (isExpired) {
                    resolve(StarValidation.saveNewRequestValidation(address))
                } else {
                    const data = {
                        address: address,
                        message: value.message,
                        requestTimeStamp: value.requestTimeStamp,
                        validationWindow: Math.floor((value.requestTimeStamp - nowSubFiveMinutes) / 1000)
                    };

                    resolve(data)
                }
            })
        })
    }
}

module.exports = StarValidation;