const uint = require('./uint')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (bytes, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(bytes))
  if (!offset) offset = 0
  var startIndex = offset
  
  uint.encode(bytes.byteLength, 256, buf, offset)
  offset += uint.encode.bytes

  var padLen = paddedLength(bytes)
  buf.fill(0, offset, offset + padLen)
  buf.set(bytes, offset)
  offset += padLen

  encode.bytes = startIndex - offset
  return buf
}

function decode (buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset

  var byteLen = uint.decode(256, buf, offset)
  offset += uint.decode.bytes

  var padLen = paddedLength(byteLen)
  var bytes = buf.subarray(offset, offset + padLen)
  return bytes.subarray(0, byteLen)
}

function encodingLength (bytes) {
  return 32 + paddedLength(bytes.byteLength)
}

function paddedLength (byteLength) {
  return Math.ceil(byteLength / 32) * 32
}
