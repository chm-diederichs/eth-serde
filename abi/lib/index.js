const assert = require('nanoassert')
const serde = require('./standard')
const packed = require('./packed')
const parse = require('./parse')

module.exports = {
  encode,
  decode,
  encodingLength,
  pack,
  unpack,
  packLength
}

function encode (signature, args, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(signature, args))
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

        serde.array.encode(args[i], item, buf, offset)
        offset += serde.array.encode.bytes
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
    serde.uint.encode(offset - startIndex, 256, buf, field.offset)

    if (item.array) {
      assert(arg instanceof Array, 'expected an array.')
      serde.array.encode(arg, item, buf, offset)
      offset += serde.array.encode.bytes
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
    var decoder = serde[item.type].decode
    if (item.static) {
      if (item.array) {
        data.push(serde.array.decode(item, buf, offset))
        offset += serde.array.decode.bytes
      } else {
        data.push(decoder(...item.opts, buf, offset))
        offset += decoder.bytes
      }
    } else {
      var dataRef = Number(serde.uint.decode(256, buf, offset))
      offset += serde.uint.decode.bytes

      var pointer = startIndex + dataRef

      if (item.array) {
        data.push(serde.array.decode(item, buf, pointer))
      } else {
        data.push(decoder(...item.opts, buf, pointer))
      }
    }
  }

  decode.bytes = offset - startIndex
  return data
}

function encodingLength (signature, args) {
  var len = 0
  var struct = parse(signature).args

  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.static) {
      if (item.array) {
        len += serde.array.encodingLength(args[i], item)
      } else {
        // static length does not depend on value
        len += serde[item.type].encodingLength(...item.opts)
      }
    } else {
      // include reference to tail index
      len += 32

      if (item.array) {
        len += serde.array.encodingLength(args[i], item)
      } else {
        len += serde[item.type].encodingLength(args[i])
      }
    }
  }

  return len
}

function pack (signature, args, buf, offset) {
  if (!buf) buf = Buffer.alloc(packLength(signature, args))
  if (!offset) offset = 0
  var startIndex = offset

  var struct = parse(signature).args
  var dynamic = []

  // head
  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.array) {
      assert(args[i] instanceof Array, 'unexpected entry.')
      assert(item.arrayLength < 0 || args[i].length === item.arrayLength,
        'array length not as specified')

      packed.array.encode(args[i], item, buf, offset)
      offset += packed.array.encode.bytes
    } else {
      var encoder = packed[item.type].encode
      encoder(args[i], ...item.opts, buf, offset)
      offset += encoder.bytes
    }
  }

  pack.bytes = offset - startIndex
  return buf
}

function unpack (signature, buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset

  const staticTypes = [
    'int',
    'uint',
    'address',
    'bool',
  ]
  
  var data = []
  var struct = parse(signature).args

  var check = struct.reduce((acc, item) => item.static ? acc : acc + 1, 0)
  assert(check < 2, 'multiple dynamic types present, unable to unpack.')

  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    // unless fixed length, array must be last item
    assert(!item.array || item.arrayLength > 0 || i === struct.length - 1,
      'packing is ambiguous, unable to unpack')
    
    // array of dynamic types cannot be decoded
    assert(!item.array || item.static || staticTypes.includes(item.type),
      'packing is ambiguous, unable to unpack')

    var decoder = packed[item.type].decode
    if (item.array) {
      data.push(packed.array.decode(item, buf, offset))
      offset += packed.array.decode.bytes
    } else {
      data.push(decoder(...item.opts, buf, offset))
      offset += decoder.bytes
    }
  }

  unpack.bytes = offset - startIndex
  return data
}

function packLength (signature, args) {
  var len = 0
  var struct = parse(signature).args

  for (let i = 0; i < struct.length; i++) {
    var item = struct[i]

    if (item.array) {
      len += packed.array.encodingLength(args[i], item)
    } else {
      len += packed[item.type].encodingLength(args[i], ...item.opts)
    }
  }

  return len
}
