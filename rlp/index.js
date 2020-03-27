const assert = require('nanoassert')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode (item, buf, offset) {
  if (!buf) buf = Buffer.alloc(encodingLength(item))
  if (!offset) offset = 0
  var startIndex = offset

  if (item instanceof Uint8Array) {
    if (item.byteLength == 0) {
      buf.writeUInt8(0x80, offset++)
    } else if (item.byteLength == 1 && item[0] < 0x80) {
      buf.writeUInt8(item[0], offset++)
    } else if (item.byteLength < 55) {
      var prefix = 0x80
      prefix += item.byteLength
      
      buf.writeUInt8(prefix, offset++)

      buf.set(item, offset)
      offset += item.byteLength
    } else {
      var prefix = 0xb7
      prefix += byteSize(item.byteLength)

      buf.writeUInt8(prefix, offset++)

      writeIntBE(item.byteLength, buf, offset)
      offset += writeIntBE.bytes

      buf.set(item, offset)
      offset += item.byteLength
    }
  } else {
    assert(item instanceof Array, 'item must be a byte-string or a list')

    var encodedEntries = item.map(entry => encode(entry)) 
    var rlpLength = encodedEntries.reduce((acc, i) => acc + i.byteLength, 0)

    if (rlpLength < 55) {
      var prefix = 0xc0
      prefix += rlpLength
      
      buf.writeUInt8(prefix, offset++)
    } else {
      var prefix = 0xf7
      prefix += byteSize(rlpLength)

      buf.writeUInt8(prefix, offset++)

      writeIntBE(rlpLength, buf, offset)
      offset += writeIntBE.bytes
    }

    for (let entry of encodedEntries) {
      buf.set(entry, offset)
      offset += entry.byteLength
    }
  }

  encode.bytes = offset - startIndex
  return buf
}

function decode (buf, offset) {
  if (!offset) offset = 0
  var startIndex = offset
  
  var ret
  var prefix = buf.readUInt8(offset++)

  if (prefix < 0x80) ret = prefix
  else if (prefix < 0xb7) {
    var len = prefix - 0x80

    ret = buf.slice(offset, offset + len)
    offset += len
  } else if (prefix < 0xc0) {
    var preLen = prefix - 0xb7

    var len = readIntBE(buf, offset, preLen)
    offset += preLen

    ret = buf.slice(offset, offset + len)
    offset += len
  } else if (prefix < 0xf8) {
    ret = []
    var len = prefix - 0xc0
    var stopIndex = offset + len

    while (offset < stopIndex) {
      ret.push(decode(buf, offset))
      offset += decode.bytes
    }
  } else {
    ret = []
    var preLen = prefix - 0xf7

    var len = readIntBE(buf, offset, preLen)
    offset += preLen

    var stopIndex = offset + len
    while (offset < stopIndex) {
      ret.push(decode(buf, offset))
      offset += decode.bytes
    }
  }

  decode.bytes = offset - startIndex
  return ret
}

function encodingLength (item) {
  if (item instanceof Uint8Array) {
    if (item.byteLength == 0) {
      return 1
    } else if (item.byteLength == 1 && item[0] < 0x80) {
      return 1
    } else if (item.byteLength < 55) {
      return 1 + item.byteLength
    } else {
      return 1 + byteSize(item.byteLength) + item.byteLength
    }
  } else {
    var len = 1
    assert(item instanceof Array, 'item must be a byte-string or a list')

    var encodedEntries = item.map(entry => encodingLength(entry))

    var rlpLength = encodedEntries.reduce((acc, len) => acc + len, 0)

    if (rlpLength > 55) {
      len += byteSize(rlpLength)
    }

    len += rlpLength
    return len
  }
}

function byteSize (num) {
  assert(num <=  Number.MAX_SAFE_INTEGER, 'num should be < 2^53 -1')

  var h = num / 0x100000000
  var l = num & 0xffffffff
  
  var hLz = Math.clz32(h)
  if (hLz !== 32) return Math.ceil((64 - hLz) / 8)

  var lLz = Math.clz32(l)
  return Math.ceil((32 - lLz) / 8)
}

function writeIntBE (num, buf, offset) {
  assert(num <=  Number.MAX_SAFE_INTEGER, 'num should be < 2^53 -1')

  if (!buf) buf = Buffer.alloc(byteSize(num))
  if (!offset) offset = 0
  var startIndex = offset

  var byteLen = byteSize(num)
  
  var h = num / 0x100000000
  var l = num & 0xffffffff
  
  switch (byteLen) {
    case 1:
      buf.writeUInt8(l, offset++)
      break
  
    case 2:
      buf.writeUInt16BE(l, offset)
      offset += 2
      break

    case 3:
      buf.writeUInt16BE((l >> 8) & 0xff, offset)
      buf.writeUInt8(l & 0xff, offset + 2)
      offset += 3
      break

    case 4:
      buf.writeUInt32BE(l, offset)
      offset += 4
      break

    case 5:
      buf.writeUInt8(h & 0xff, offset)
      buf.writeUInt32BE(l, offset + 1)
      offset += 5
      break

    case 6:
      buf.writeUInt16BE(h & 0xffff, offset)
      buf.writeUInt32BE(l, offset + 2)
      offset += 6
      break

    case 7:
      buf.writeUInt8((h >> 16) & 0xff, offset)
      buf.writeUInt16BE(h & 0xffff, offset + 1)
      buf.writeUInt32BE(l, offset + 3)
      offset += 7
      break
  }

  writeIntBE.bytes = offset - startIndex
  return buf
}

function readIntBE (buf, offset, byteLength) {
  if (!offset) offset = 0
  var startIndex = offset
  
  var int = Buffer.alloc(8)
  var leadingZeroBytes = 8 - byteLength
  var bytes = buf.subarray(offset, offset + byteLength)

  int.set(bytes, leadingZeroBytes)

  var h = int.readUInt32BE() * 0x100000000
  var l = int.readUInt32BE(4)

  return h + l
}
