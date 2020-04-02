const assert = require('nanoassert')
const abi = require('./lib')
const keccak = require('sha3-wasm').keccak256

module.exports = {
  raw: abi,
  encodeConstructor,
  encodeMethod,
  encodeEvent: encodeMethod,
  encodeLocal,
  encodeMethodExternal,
  encodeMethodType
  methodID
}

function encodeConstructor (bytecode, signature, args) {
  var buf = Buffer.alloc(bytecode.byteLength + encodingLength(signature, args))
  var offset = 0

  buf.set(bytecode)
  
  return abi.encode(signature, args, buf, bytecode.byteLength)
}

function encodeMethod (name, signature, args) {
  var buf = Buffer.alloc(4 + encodingLength(signature, args))

  buf.set(methodID(name, signature))

  return abi.encode(signature, args, buf, 4)
}

function encodeLocal (contractAddress, method) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(typeof method === 'string', 'method must be string')

  return abi.pack(
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

  return abi.pack(
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

  return abi.pack(
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
