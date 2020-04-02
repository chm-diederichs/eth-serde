const assert = require('nanoassert')
const serde = {
  address: require('./address'),
  bool: require('./bool'),
  bytes: require('./bytes'),
  int: require('./int'),
  string: require('./string'),
  uint: require('./uint')
}

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (arr, enc, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(arr, enc))
  if (!offset) offset = 0
  var startIndex = offset

  if (enc.arrayLength < 0) {
    serde.uint.encode(arr.length, 256, buf, offset)
    offset += serde.uint.encode.bytes
  }

  for (let item of arr) {
    serde[enc.type].encode(item, ...enc.opts, buf, offset)
    offset += serde[enc.type].encode.bytes
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (enc, buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset
  
  var len = enc.arrayLength
  if (enc.arrayLength < 0) {
    len = serde.uint.decode(256, buf, offset)
    offset += serde.uint.decode.bytes
  }

  var arr = []
  for (let i = 0; i < len; i++) {
    var item = serde[enc.type].decode(...enc.opts, buf, offset)
    offset += serde[enc.type].decode.bytes
    arr.push(item)
  }

  decode.bytes = offset - startIndex
  return arr
}

function encodingLength (arr, enc) {
  var len = 0

  if (enc.arrayLength < 0) len += serde.uint.encodingLength(256)

  for (let item of arr) {
    len += serde[enc.type].encodingLength(...enc.opts, item)
  }

  return len
}
