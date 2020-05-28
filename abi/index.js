const assert = require('nanoassert')
const abi = require('./lib')
const keccak = require('sha3-wasm').keccak256

module.exports = {
  raw: abi,
  encodeConstructor,
  encodeMethod,
  encodeEvent: encodeMethod,
  decodeOutput,
  methodID
}

function encodeConstructor (bytecode, signature, args) {
  var buf = Buffer.alloc(bytecode.byteLength + abi.encodingLength(signature, args))
  var offset = 0

  buf.set(bytecode)
  
  return abi.encode(signature, args, buf, bytecode.byteLength)
}

function encodeMethod (name, signature, args) {
  var buf = Buffer.alloc(4 + abi.encodingLength(signature, args))

  buf.set(methodID(name, signature))

  return abi.encode(signature, args, buf, 4)
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

  const result = abi.decode(signature, data)
}

function methodID (name, signature) {
  if (name instanceof Uint8Array) name = name.toString()
  var toHash = name + '(' + signature.join(',') + ')'
  const hash = keccak().update(toHash).digest()
  return hash.slice(0, 4)
}
