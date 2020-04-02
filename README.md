# eth-serde

## Usage

```js
const serde = require('eth-serde')

var func = 'test'
var signature = ['string', 'bytes4[]']
var bufs = [Buffer.from(', wo'), Buffer.from('rld!')]
var args = ['hello', bufs]

serde.abi.encodeMethod(func, signature, args)
// <Buffer bf 2a 22 5a 00 00 ... 222 more bytes>

serde.abi.raw.pack(signature, args)
// <Buffer 68 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21>

serde.rlp.encode(bufs)
// <Buffer ca 84 2c 20 77 6f 84 72 6c 64 21>

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

### ABI Encoding

Raw ABI encoding.

#### `serde.raw.encode (signature, args, [buf, offset])`

#### `serde.raw.decode (signature, [buf, offset])`

#### `serde.raw.encodingLength (signature, args)`

#### `serde.raw.pack (signature, args, [buf, offset])`

#### `serde.raw.unpack (signature, [buf, offset])`

#### `serde.raw.packLength (signature, args)`

### RLP Encoding

Recursive length prefix encoding.

### `serde.rlp.encode(item, [buf, offset])`

### `serde.rlp.encode(buf, [offset])`

### `serde.rlp.encodingLength(item)`
