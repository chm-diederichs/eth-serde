const assert = require('nanoassert')
const pack = {
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

  for (let item of arr) {
    pack[enc.type].encode(item, ...enc.opts, buf, offset)
    offset += pack[enc.type].encode.bytes
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (enc, buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset
  
  var len = enc.arrayLength

  var arr = []
  if (len > 0) {
    for (let i = 0; i < len; i++) {
      var item = pack[enc.type].decode(...enc.opts, buf, offset)
      offset += pack[enc.type].decode.bytes
      arr.push(item)
    }
  } else {
    while (offset < buf.byteLength) {
      var item = pack[enc.type].decode(...enc.opts, buf, offset)
      offset += pack[enc.type].decode.bytes
      arr.push(item)  
    }
  }

  decode.bytes = offset - startIndex
  return arr
}

function encodingLength (arr, enc) {
  var len = 0
  for (let item of arr) {
    len += pack[enc.type].encodingLength(...enc.opts, item)
  }

  return len
}
