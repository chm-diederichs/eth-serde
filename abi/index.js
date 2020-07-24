const assert = require('nanoassert')
const abi = require('./lib')
const keccak = require('sha3-wasm').keccak256

module.exports = {
  raw: abi,
  encodeConstructor,
  encodeMethod,
  decodeMethod,
  encodeEvent: encodeMethod,
  decodeOutput,
  methodID,
  eventID
}

function encodeConstructor (bytecode, signature, args) {
  var buf = Buffer.alloc(bytecode.byteLength + abi.encodingLength(signature, args))

  buf.set(bytecode)

  return abi.encode(signature, args, buf, bytecode.byteLength)
}

function encodeMethod (name, signature, args) {
  var buf = Buffer.alloc(4 + abi.encodingLength(signature, args))

  buf.set(methodID(name, signature))

  return abi.encode(signature, args, buf, 4)
}

function decodeMethod (signature, buf) {
  const methodId = abi.unpack(['bytes4'], buf)
  const data = abi.decode(signature, buf, 4)

  return {
    methodId,
    data
  }
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

  return abi.decode(signature, data)
}

function eventID (name, signature) {
  if (name instanceof Uint8Array) name = name.toString()
  var toHash = name + '(' + signature.join(',') + ')'
  const hash = keccak().update(toHash).digest()
  return hash
}

function methodID (name, signature) {
  return eventID(name, signature).slice(0, 4)
}
