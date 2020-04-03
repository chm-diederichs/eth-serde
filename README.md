# eth-serde

## Usage

```js
const { abi, rlp } = require('eth-serde')

var func = 'test'
var signature = ['string', 'bytes4[]']
var bufs = [Buffer.from(', wo'), Buffer.from('rld!')]
var args = ['hello', bufs]

abi.encodeMethod(func, signature, args)
// <Buffer bf 2a 22 5a 00 00 ... 222 more bytes>

abi.raw.pack(signature, args)
// <Buffer 68 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21>

rlp.encode(bufs)
// <Buffer ca 84 2c 20 77 6f 84 72 6c 64 21>

```

## API

### Methods

Compound methods.

#### `abi.encodeConstructor(bytecode, signature, args)`

#### `abi.encodeMethod(name, signature, args)`

#### `abi.decodeOutput(signature, data)`

#### `abi.methodID(name, signature)`

### ABI Encoding

Raw ABI encoding.

#### `abi.raw.encode (signature, args, [buf, offset])`

#### `abi.raw.decode (signature, [buf, offset])`

#### `abi.raw.encodingLength (signature, args)`

#### `abi.raw.pack (signature, args, [buf, offset])`

#### `abi.raw.unpack (signature, [buf, offset])`

#### `abi.raw.packLength (signature, args)`

### RLP Encoding

Recursive length prefix encoding.

### `rlp.encode(item, [buf, offset])`

### `rlp.encode(buf, [offset])`

### `rlp.encodingLength(item)`
