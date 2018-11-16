# Star Notarization on Blockchain

A Star Registry Service that allows users to claim ownership of their favorite star in the night sky.

# Implementations in this project.

Create a Blockchain dataset that allow you to store a Star 

- The application will persist the data (using LevelDB).
- The application will allow users to identify the Star data with the owner.

Create a Mempool component

- The mempool component will store temporal validation requests for 5 minutes (300 seconds).
- The mempool component will store temporal valid requests for 30 minutes (1800 seconds).
- The mempool component will manage the validation time window.

Create a REST API that allows users to interact with the application.

- The API will allow users to submit a validation request.
- The API will allow users to validate the request.
- The API will be able to encode and decode the star data.
- The API will allow be able to submit the Star data.
- The API will allow lookup of Stars by hash, wallet address, and height.

# Tech & Dependencies

* [Node.js] - Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine.
* [Express.js] - Fast, unopinionated, minimalist web framework for Node.js
* [Crypto.js] - JavaScript library of crypto standards.
* [LevelDb] - Fast & simple storage - a Node.js-style LevelDB wrapper.
* [Bitcoin.js] - A javascript Bitcoin library for node.js and browsers.
* [Body-parser] - Node.js body parsing middleware
* [Compression] - Node.js compression middleware
* [Postman] - Postman Makes API Development Simple.
* [Electrum Wallet] - Electrum Bitcoin Wallet

### Installation

Notary Blockchain requires [Node.js](https://nodejs.org/) v4+ to run.

Install the dependencies and start the server.

```sh
$ cd NotaryBlockchain
$ npm install
$ node index
```
The node server will be deployed to http://localhost:8000

Download and install [Electrum Wallet] to create your bitcoin wallet.

Get your bitcoin address from Electrum Wallet.

![Get Bitcoin Address](https://i.imgur.com/E7XrY8z.png/)

Now use Postman to interact with the API.

#### POST
Request new address validation. Use POST.

![Request Validation](https://i.imgur.com/tPOMndp.png)

Copy message from the Output JSON as below: 

```json
"message": "1BLDemo8Wx1yP3TBMUvjdBHqtRMWDUHSMv:1542358724640:starRegistry",
```

Use Electrum Wallet to Sign this message with your bitcoin address. 

![Signing Message with Bitcoin Address](https://i.imgur.com/xDME0oP.png)

Copy the the generated signature and use POST to validate Signature.

![Validate Signed Message](https://i.imgur.com/qdZoHsG.png)

The JSON should return 
```json
"messageSignature": "valid"
```

Now to register your stars please visit [Skymap](https://in-the-sky.org/skymap.php). Find your favorite star and double click to view its co-ordinates.

![Star Co-ordinates](https://i.imgur.com/S3mnpaU.png)

We need these co-ordinates for registration with a story (Only ASCII text) you want to write about your star. Story has maximum limit of 500 bytes.

- RA = Right Ascension
- DEC = Declination
- MAG = Magnitude
- CON = Constellation

Use POST to send this JSON request to register your star with address parameter at http://localhost:8000/block

```json
{
	"address" : "1BLDemo8Wx1yP3TBMUvjdBHqtRMWDUHSMv",
	"star" : {
		"ra" : "17h41m",
		"dec" : "-40°06",
		"mag" : "7.50",
		"con" : "Scorpius",
		"story" : "From Pune Cr 343 is not observable it will reach its highest point in the sky during daytime and is no higher than 6 degrees above the horizon at dusk."
	}
}
```

![Star Registration](https://i.imgur.com/Dvm80l6.png)

In the output you will find the story written has been hex encoded.

```json
"story": "46726f6d2050756e6520437220333433206973206e6f74206f627365727661626c652069742077696c6c20726561636820697473206869676865737420706f696e7420696e2074686520736b7920647572696e672064617974696d6520616e64206973206e6f20686967686572207468616e203620646567726565732061626f76652074686520686f72697a6f6e206174206475736b2e"
```

#### GET

Get Block by height parameter. ```http://localhost:8000/block/{$height}```

![Get Block by height](https://i.imgur.com/PgrUzV1.png)

Get Block by address parameter ```http://localhost:8000/stars/address:address```

![Get Block by address](https://i.imgur.com/foYu4b4.png)

Get Block by hash value parameter ```http://localhost:8000/stars/hash:hash```

![Get Block by hash](https://i.imgur.com/kwyW6dr.png)


   [express.js]: <https://expressjs.com/>
   [crypto.js]: <https://github.com/brix/crypto-js>
   [levelDb]: <https://github.com/Level/level>
   [bitcoin.js]: <https://github.com/bitcoinjs/bitcoinjs-lib>
   [body-parser]: <https://github.com/expressjs/body-parser>
   [compression]: <https://github.com/expressjs/compression>
   [node.js]: <http://nodejs.org>
   [postman]: <https://www.getpostman.com/>
   [electrum wallet]: <https://electrum.org/>

