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

  buf.writeUInt8(enc, offset++)

  encode.bytes = offset - startIndex
  return buf
}

function decode (buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset

  var value = buf.readUInt8(offset++)
  assert(value <= 1, 
    `unexpected value: expected bool, offset: ${offset}`)

  decode.bytes = offset - startIndex
  return value === 1
}

function encodingLength () {
  return 1
}
