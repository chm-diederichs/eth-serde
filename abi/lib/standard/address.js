const assert = require('nanoassert')
const uint = require('./uint')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (address, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(address))
  if (!offset) offset = 0
  var startIndex = offset

  assert(typeof address === 'string' && address.substring(0, 2) === '0x'
    && address.length <= 42, "address must be passed as a prefixed hex string <= 20 bytes long")

  uint.encode(address, 160, buf, offset)
  offset += uint.encode.bytes

  encode.bytes = offset - startIndex
  return buf
}

function decode (buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset

  var address = uint.decode(160, buf, offset)
  offset += uint.decode.bytes

  decode.bytes = offset - startIndex
  return '0x' + address.toString(16).padStart(40, 0)
}

function encodingLength (address) {
  return uint.encodingLength(160)
}
