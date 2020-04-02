const assert = require('nanoassert')
const bytes = require('./bytes')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (str, buf, offset) {
  assert(typeof str === 'string', 'expect a string.')
  if (!buf) buf = Buffer.alloc(encodingLength(str))
  if (!offset) offset = 0
  var startIndex = offset

  var enc = Buffer.from(str, 'utf8')

  bytes.encode(enc, buf, offset)
  offset += bytes.encode.bytes

  encode.bytes = offset - startIndex
  return buf
}

function decode (len, buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset

  var enc = bytes.decode(len, buf, offset)
  offset += bytes.decode.bytes

  decode.bytes = offset - startIndex
  return enc.toString('utf8')
}

function encodingLength (str) {
  return bytes.encodingLength(Buffer.from(str, 'utf8'))
}
