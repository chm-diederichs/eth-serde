const assert = require('nanoassert')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (num, bits, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(bits))
  if (!offset) offset = 0
  var startIndex = offset
  
  if (typeof num === 'string' || typeof num === 'bigint') num = '0x' + num.toString()
  
  // string passed should be n mod 2**256
  if (typeof num === 'string') {
    assert(num.substring(0, 2) === '0x', "string should be prefixed with '0x'")

    var byteLen = Math.ceil(num.length / 2) - 1
    assert(byteLen * 8 <= bits, `num must be at most ${bits}bits`)

    var padLen = encodingLength(bits)
    var end = offset + padLen
    var start = end - byteLen

    buf.fill(num.substring(2), start, end, 'hex')
    offset += padLen
  }

  if (num instanceof Uint8Array) {
    assert(num.byteLength * 8 <= bits, `num must be at most ${bits}bits`)

    var padLen = encodingLength(bits)
    var start = offset + padLen - num.byteLength

    buf.set(num, start)
    offset += padLen
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (bits, buf, offset) {
  if (!offset) offset = 0

  var padLen = encodingLength(bits)
  
  var start = offset + padLen - bits / 8

  return buf.subarray(start, offset + padLen)
}

function encodingLength (bits) {
  return Math.ceil(bits / 256) * 32
}
