const assert = require('nanoassert')
const int = require('./int')

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

  if (!buf) buf = Buffer.alloc(encodingLength(num))
  if (!offset) offset = 0
  var startIndex = offset

  if (typeof num === 'number') num = BigInt(num)

  if (typeof num === 'string') {
    assert(num.substring(0, 2) === '0x', 'num should be passed as a hex encoded string')
    num = BigInt(num)
  }

  assert(num < 2n ** BigInt(bits), "number should be at most 'bits' long")

  if (num > 2n ** BigInt(bits) / 2n - 1n) {
    num = num - 2n ** BigInt(bits)
  }

  var enc = num * 10n ** BigInt(exponent)
  int.encode(enc, buf, offset)
  offset += int.encode.bytes

  encode.bytes = offset - startIndex
  return buf
}

function decode (exponent, bits, buf, offset) {
  if (exponent instanceof Uint8Array) return decode(18, exponent, bits, buf)
  if (bits instanceof Uint8Array) return decode(exponent, 128, bits, buf)

  if (!offset) offset = 0
  var startIndex = offset

  var num = int.decode(256, buf, offset)
  offset += int.decode.bytes

  decode.bytes = offset - startIndex
  num = num / 10n ** BigInt(exponent)

  if (num > 2n ** BigInt(bits) / 2n - 1n) {
    num = num - 2n ** BigInt(bits)
  }

  return num
}

function encodingLength () {
  return int.encodingLength(256)
}
