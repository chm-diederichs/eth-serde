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
  assert(bytes.byteLength > 0 && len !== 0, 'cannot encode zero-length buffer')
  if (!len) len = -1
  if (!buf) buf = len < 0 
    ? Buffer.alloc(encodingLength(bytes))
    : Buffer.alloc(encodingLength(len))

  if (!offset) offset = 0
  var startIndex = offset

  if (len < 0) {
    uint.encode(bytes.byteLength, 256, buf, offset)
    offset += uint.encode.bytes
  } else {
    assert(bytes.byteLength === len, "fixed length byte arrays should be 'len' bytes")
  }

  var padLen = paddedLength(bytes.byteLength)
  buf.fill(0, offset, offset + padLen)
  buf.set(bytes, offset)
  offset += padLen

  encode.bytes = offset - startIndex
  return buf
}

function decode (len, buf, offset) {
  if (len instanceof Uint8Array) return decode(-1, len, buf)
  if (!offset) offset = 0
  var startIndex = offset

  if (len < 0) {
    len = Number(uint.decode(256, buf, offset))
    offset += uint.decode.bytes
  }

  var padLen = paddedLength(len)
  var bytes = buf.subarray(offset, offset + padLen)
  offset += padLen

  decode.bytes = offset - startIndex
  return bytes.subarray(0, len)
}

function paddedLength (byteLength) {
  return Math.ceil(byteLength / 32) * 32
}

function encodingLength (bytes, length) {
  if (length > 0) return length
  if (!(bytes instanceof Uint8Array)) return encodingLength(format(bytes), length)
  if (typeof bytes === 'number') return paddedLength(bytes)
  return 32 + paddedLength(bytes.byteLength)
}

function format (bytes) {
  if (bytes instanceof Uint8Array) return bytes
  if (typeof bytes === 'string') {
    assert(bytes[1] === 'x', "hex string must be '0x' prefixed")
    return Buffer.from(bytes.substring(2), 'hex')
  }

  console.log(bytes)
  assert(false, 'unexpected type: expected byte array or hex string')
}
