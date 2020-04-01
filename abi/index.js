const assert = require('nanoassert')
const serde = require('./lib')
const array = require('./array')
const parse = require('./parse')
const keccak = require('sha3-wasm').keccak256

module.exports = {
  encode,
  decode,
  encodingLength,
  encodeConstructor,
  encodeMethod,
  encodeLocal,
  encodeMethodExternal,
  encodeMethodType
}

function encode (signature, args, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(signature, args))
  if (!offset) offset = 0
  var startIndex = offset

  var struct = parse(signature).args
  var dynamic = []

  // head
  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.static) {
      if (item.array) {
        assert(args[i] instanceof Array &&
          args[i].length === item.arrayLength, 'unexpected entry.')

        array.encode(args[i], item, buf, offset)
        offset += array.encode.bytes
      } else {
        var encoder = serde[item.type].encode

        encoder(args[i], ...item.opts, buf, offset)
        offset += encoder.bytes
      }
    } else {
      // reserve for pointer to dynamic data
      dynamic.push({ i, offset })
      offset += 32
    }
  }

  // tail
  for (let field of dynamic) {
    var item = struct[field.i]
    var arg = args[field.i]

    // encode offset to head
    serde.uint.encode(offset - startIndex, 256, buf, field.offset)

    if (item.array) {
      assert(arg instanceof Array, 'expected an array.')
      array.encode(arg, item, buf, offset)
      offset += array.encode.bytes
    } else {
      var encoder = serde[item.type].encode
      encoder(arg, ...item.opts, buf, offset)
      offset += encoder.bytes
    }
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (signature, buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset
  
  var data = []
  var struct = parse(signature).args

  for (let item of struct) {
    var decoder = serde[item.type].decode
    if (item.static) {
      if (item.array) {
        data.push(array.decode(item, buf, offset))
        offset += array.decode.bytes
      } else {
        data.push(decoder(...item.opts, buf, offset))
        offset += decoder.bytes
      }
    } else {
      var dataRef = Number(serde.uint.decode(256, buf, offset))
      offset += serde.uint.decode.bytes

      var pointer = startIndex + dataRef

      if (item.array) {
        data.push(array.decode(item, buf, pointer))
      } else {
        data.push(decoder(...item.opts, buf, pointer))
      }
    }
  }

  decode.bytes = offset - startIndex
  return data
}

function encodingLength (signature, args) {
  var len = 0
  var struct = parse(signature).args

  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.static) {
      if (item.array) {
        len += array.encodingLength(args[i], item)
      } else {
        len += serde[item.type].encodingLength(args[i], ...item.opts)
      }
    } else {
      // include reference to tail index
      len += 32

      if (item.array) {
        len += array.encodingLength(args[i], item)
      } else {
        len += serde[item.type].encodingLength(args[i], ...item.opts)
      }
    }
  }

  return len
}

function encodeConstructor (bytecode, signature, args) {
  var buf = Buffer.alloc(bytecode.byteLength + encodingLength(signature, args))
  var offset = 0

  buf.set(bytecode)
  
  return encode(signature, args, buf, bytecode.byteLength)
}

function encodeMethod (name, signature, args) {
  var buf = Buffer.alloc(4 + encodingLength(signature, args))

  buf.set(methodID(name, signature))

  return encode(signature, args, buf, 4)
}

function encodeLocal (contractAddress, method) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(typeof method === 'string', 'method must be string')

  return pack(
    ['address', 'string'],
    [contractAddress, method]
  )
}

function encodeMethodExternal (contractAddress, contract, method, signature) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(contractAddress.length === 42, 'contractAddress must be an ethereum address')
  assert(typeof contract === 'string', 'contract must be string')
  assert(contract.length === 42, 'contract must be 42 bytes (160 bit)')
  assert(typeof method === 'string', 'method must be string')
  assert(Array.isArray(signature), 'signature must be an array of solidity types')

  return pack(
    ['bytes', 'address', 'bytes4'],
    [encodeLocal(contractAddress, 'execute'), contract, methodID(method, signature)]
  )
}

function encodeMethodType (contractAddress, codehash, method, signature) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(contractAddress.length === 42, 'contractAddress must be an ethereum address')
  assert(typeof codehash === 'string', 'codehash must be string')
  assert(codehash.length === 66, 'codehash must be 66 bytes (256 bit)')
  assert(typeof method === 'string', 'method must be string')
  assert(Array.isArray(signature), 'signature must be an array of solidity types')

  return pack(
    ['bytes', 'bytes32', 'bytes4'],
    [encodeLocal(contractAddress, 'executeType'), codehash, methodID(method, signature)]
  )
}

function decodeOutput (signature, data) {
  const addrIdx = []
  const addrListIdx = []
  
  if (data[1] === 'x') data = Buffer.from(data.slice(2), 'hex')
  for (var i = 0; i < signature.length; i++) {
    if (signature[i] === 'address') {
      addrIdx.push(i)
    }

    if (signature[i] === 'address[]') {
      addrListIdx.push(i)
    }
  }

  const result = decode(signature, data)
}

function methodID (name, signature) {
  if (name instanceof Uint8Array) name = name.toString()
  var toHash = name + '(' + signature.join(',') + ')'
  const hash = keccak().update(toHash).digest()
  return hash.slice(0, 4)
}
