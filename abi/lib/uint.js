const assert = require('nanoassert')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (num, bits, buf, offset) {
  if (bits instanceof Uint8Array) return encode(num, 256, bits, buf)
  if (!bits) bits = 256
  if (!buf) buf = Buffer.alloc(encodingLength(bits))
  if (!offset) offset = 0
  var startIndex = offset
  
  if (typeof num === 'number' || typeof num === 'bigint') {
    assert(typeof number === 'number' ? num >= 0 : num >= 0n,
      'expect an unsigned integer')

    num = '0x' + num.toString(16)
  }

  assert(typeof num === 'string' || num instanceof Uint8Array,
    'number must be passed as a Number, BigInt or hex encoded string.')

  // string passed should be n mod 2**256
  if (typeof num === 'string') {
    assert(num.substring(0, 2) === '0x', "string should be prefixed with '0x'")
    
    num = num.length % 2 ? '0' + num.substring(2) : num.substring(2)
    assert(num.length !== 0, 'no digits')

    var byteLen = Math.ceil(num.length / 2)
    assert(byteLen * 8 <= bits, "num must be at most 'bits' long")

    var padLen = encodingLength(bits)
    var end = offset + padLen
    var start = end - byteLen

    buf.fill(num, start, end, 'hex')
    offset += padLen
  }

  if (num instanceof Uint8Array) {
    assert(num.byteLength * 8 <= bits, "num must be at most 'bits' long")

    var padLen = encodingLength(bits)
    var start = offset + padLen - num.byteLength

    buf.set(num, start)
    offset += padLen
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (bits, buf, offset) {
  if (bits instanceof Uint8Array) return decode(256, bits, buf)
  if (!offset) offset = 0
  var startIndex = offset

  var padLen = encodingLength(bits)
  
  var start = offset + padLen - bits / 8

  var num = '0x' + buf.subarray(start, offset + padLen).toString('hex')
  offset += padLen

  decode.bytes = offset - startIndex
  return BigInt(num)
}

function encodingLength (bits) {
  return Math.ceil(bits / 256) * 32
}

