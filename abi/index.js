const assert = require('nanoassert')
const serde = require('./lib')
const array = require('./array')
const parse = require('./parse')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (args, signature, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(args, signature))
  if (!offset) offset = 0
  var startIndex = offset

  var struct = parse(signature).args
  var dynamic = []

  // head
  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.static) {
      if (item.array) {
        assert(args[i] instanceof Array &&
          args[i].length === item.arrayLength, 'unexpected entry.')

        array.encode(args[i], item, buf, offset)
        offset += array.encode.bytes
      } else {
        var encoder = serde[item.type].encode

        encoder(args[i], ...item.opts, buf, offset)
        offset += encoder.bytes
      }
    } else {
      // reserve for pointer to dynamic data
      dynamic.push({ i, offset })
      offset += 32
    }
  }

  // tail
  for (let field of dynamic) {
    var item = struct[field.i]
    var arg = args[field.i]

    // encode offset to head
    serde.uint.encode(offset, 256, buf, field.offset)

    if (item.array) {
      assert(arg instanceof Array, 'expected an array.')
      array.encode(arg, item, buf, offset)
      offset += array.encode.bytes
    } else {
      var encoder = serde[item.type].encode
      encoder(arg, ...item.opts, buf, offset)
      offset += encoder.bytes
    }
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (signature, buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset
  
  var data = []
  var struct = parse(signature).args

  for (let item of struct) {
    if (item.static) {
      var decoder = serde[item.type].decode
      if (item.array) {
        data.push(array.decode(item, buf, offset))
        offset += array.decode.bytes
      } else {
        data.push(decoder(...item.opts, buf, offset))
        offset += decode.bytes
      }
    } else {
      var dataRef = Number(serde.uint.decode(256, buf, offset))
      offset += serde.uint.decode.bytes

      var pointer = startIndex + dataRef

      if (item.array) {
        data.push(array.decode(item, buf, pointer))
      } else {
        data.push(decode(...item.opts, buf, pointer))
      }
    }
  }

  decode.bytes = offset - startIndex
  return data
}

function encodingLength (args, signature) {
  var len = 0
  var struct = parse(signature).args

  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.static) {
      if (item.array) {
        len += array.encodingLength(args[i], item)
      } else {
        var length = serde[item.type].encodingLength
        len += length(...item.opts)
      }
    } else {
      // include reference to tail index
      len += 32

      if (item.array) {
        len += array.encodingLength(args[i], item)
      } else {
        len += serde[item.type].encodingLength(args[i])
      }
    }
  }

  return len
}
