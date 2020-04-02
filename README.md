# eth-serde

## Usage

```js
const serde = require('eth-serde')

var func = 'test'
var signature = ['string', 'bytes4[]']
var args = ['hello', [Buffer.from(', wo'), Buffer.from('rld!')]]

serde.abi.encodeMethod(func, signature, args)
// 

serde.abi.raw.pack(signature, args)
// 

```

## API

### Methods

Compound methods.

#### `serde.encodeConstructor(bytecode, signature, args)`

#### `serde.encodeMethod(name, signature, args)`

#### `serde.encodeLocal(contractAddress, method)`

#### `serde.encodeMethodExternal(contractAddress, contract, method, signature)`

#### `serde.encodeMethodType(contractAddress, codehash, method, signature)`

#### `serde.decodeOutput(signature, data)`

#### `serde.methodID(name, signature)`

### Raw Encode

Raw encoders.

#### `serde.raw.encode (signature, args, buf, offset)`

#### `serde.raw.decode (signature, buf, offset)`

#### `serde.raw.encodingLength (signature, args)`

#### `serde.raw.pack (signature, args, buf, offset)`

#### `serde.raw.unpack (signature, buf, offset)`

#### `serde.raw.packLength (signature, args)`
