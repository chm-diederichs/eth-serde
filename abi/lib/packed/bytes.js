const assert = require('nanoassert')
const uint = require('./uint')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (bytes, len, buf, offset) {
  if (typeof bytes === 'string') return encode(format(bytes), len, buf, offset)
  if (len instanceof Uint8Array) return encode(bytes, -1, len, buf)
  if (!len) len = -1
  assert(bytes.byteLength === len  || len < 0, 'bytes should be of the length specified')
  assert(bytes.byteLength > 0 && len !== 0, 'cannot encode zero-length buffer')
  if (!buf) buf = Buffer.alloc(encodingLength(bytes.byteLength))
  if (!offset) offset = 0
  var startIndex = offset

  buf.set(bytes, offset)
  offset += bytes.byteLength

  encode.bytes = offset - startIndex
  return buf
}

function decode (len, buf, offset) {
  if (len instanceof Uint8Array) return decode(-1, len, buf)
  if (!offset) offset = 0
  var startIndex = offset

  if (len < 0) len = buf.byteLength - offset

  var bytes = buf.subarray(offset, offset + len)
  offset += len

  decode.bytes = offset - startIndex
  return bytes
}

function encodingLength (bytes, length) {
  if (length > 0) return length
  if (!(bytes instanceof Uint8Array)) return encodingLength(format(bytes), length)
  if (typeof bytes === 'number') return bytes
  return bytes.byteLength
}

function format (bytes) {
  if (bytes instanceof Uint8Array) return bytes
  if (typeof bytes === 'string') {
    assert(bytes[1] === 'x', "hex string must be '0x' prefixed")
    return Buffer.from(bytes.substring(2), 'hex')
  }

  assert(false, 'unexpected type: expected byte array or hex string')
}
