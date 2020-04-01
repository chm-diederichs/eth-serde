const assert = require('nanoassert')
const uint = require('./uint')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (bool, buf, offset) {
  assert(typeof bool === 'boolean', 'expect boolean')
  if (!buf) buf = Buffer.alloc(encodingLength(bool))
  if (!offset) offset = 0
  var startIndex = offset
  
  var enc = bool ? 1 : 0

  uint.encode(enc, 8, buf, offset)
  offset += uint.encode.bytes

  encode.bytes = offset - startIndex
  return buf
}

function decode (buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset

  var value = uint.decode(8, buf, offset)
  offset += uint.decode.bytes
  assert(value === 0n || value === 1n, `unexpected value: expected bool, offset: ${offset}`)

  decode.bytes = offset - startIndex
  return value === 1n
}

function encodingLength () {
  return uint.encodingLength(8)
}
