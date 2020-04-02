const assert = require('nanoassert')
const uint = require('./uint')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (num, exponent, bits, buf, offset) {
  if (exponent instanceof Uint8Array) return encode(num, 18, exponent, bits, buf)
  if (bits instanceof Uint8Array) return encode(num, exponent, 128, bits, buf)
  if (exponent === undefined) exponent = 18
  if (bits === undefined) bits = 128
  if (!buf) buf = Buffer.alloc(encodingLength())
  if (!offset) offset = 0
  var startIndex = offset
  
  if (typeof num === 'number') num = BigInt(num)

  if (typeof num === 'string') {
    assert(num.substring(0, 2) === '0x', 'num should be passed as a hex encoded string')
    num = BigInt(num)
  }

  assert(num < 2n ** BigInt(bits), "number should be at most 'bits' long")

  var enc = num * 10n ** BigInt(exponent)
  uint.encode(enc, buf, offset)
  offset += uint.encode.bytes

  encode.bytes = offset - startIndex
  return buf
}

function decode (exponent, bits, buf, offset) {
  if (exponent instanceof Uint8Array) return decode(18, exponent, bits, buf)
  if (bits instanceof Uint8Array) return decode(exponent, 128, bits, buf)
  if (exponent === undefined) exponent = 18
  if (bits === undefined) bits = 128
  if (!offset) offset = 0
  var startIndex = offset

  var num = uint.decode(buf, offset)
  offset += uint.decode.bytes

  decode.bytes = offset - startIndex
  return num / 10n ** BigInt(exponent)
}

function encodingLength () {
  return uint.encodingLength(256)
}
