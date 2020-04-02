const assert = require('nanoassert')

module.exports = parseTuple

function parseTuple (tuple, head = 0, tail = 0) {
  if (typeof contract === 'string') contract = JSON.parse(contract)

  var parsed = {}
  parsed.args = tuple.map(parseArgument)
  parsed.static = staticCheck(parsed.args)

  return parsed
}

function parseArgument (arg, head, tai) {
  if (arg instanceof Array) return parseTuple(arg)
  assert(typeof arg === 'string', 'types must be passed as strings')

  const ret = {}
  ret.opts = []

  var closeBracket = arg.indexOf(']')
  if (closeBracket !== -1) {
    ret.array = true

    var openBracket = arg.indexOf('[')
    if (closeBracket - openBracket > 1) {
      ret.arrayLength = parseInt(arg.substring(openBracket + 1, closeBracket))
    } else {
      ret.arrayLength = -1
    }
  } else ret.array = false

  // int
  if (arg.substring(0,3) === 'int') {
    ret.type = 'int'
    var bits = parseSuffix(arg, 3)
    if (bits) ret.opts.push(bits)
  }

  // uint
  if (arg.substring(0, 4) === 'uint') {
    ret.type = 'uint'
    var bits = parseSuffix(arg, 4)
    if (bits) ret.opts.push(bits)
  }
  
  // bool
  if (arg.substring(0, 4) === 'bool') {
    ret.type = 'bool'
  }

  // address
  if (arg.substring(0, 7) === 'address') {
    ret.type = 'address'
  }

  // fixed
  if (arg.substring(0, 5) === 'fixed') {
    return new Error('not currently supported: fixed')
    ret.type = 'fixed'
    var bits = parseSuffix(arg, 5)
    if (bits) ret.opts.push(bits)
  }

  // ufixed
  if (arg.substring(0, 6) === 'ufixed') {
    return new Error('not currently supported: ufixed')
    ret.type = 'ufixed'
    var bits = parseSuffix(arg, 6)
    if (bits) ret.opts.push(bits)
  }

  // string
  if (arg.substring(0, 6) === 'string') {
    ret.type = 'string'
  }

  // bytes
  if (arg.substring(0, 5) === 'bytes') {
    ret.type = 'bytes'
    var bytes = parseSuffix(arg, 5)
    ret.opts.push(bytes ? bytes : -1)
  }

  ret.static = staticCheck(ret)
  return ret
}

function staticCheck (item) {
  if (item.arrayLength < 0) return false

  if (item instanceof Array) {
    return item.reduce((acc, i) => acc && staticCheck(i), true)
  }

  const staticTypes = [
    'int',
    'uint',
    'fixed',
    'ufixed',
    'address',
    'bool',
  ]

  if (staticTypes.includes(item.type)) {
    if (!item.array || item.arrayLength > 0) return true
  }
  
  if (item.type === 'bytes' && item.opts[0] > 0) return true
  return false
}

function parseSuffix (string, offset) {
  var bracket = string.indexOf('[')
  var end = bracket < 0 ? string.length : bracket

  if (offset === end) return
  return parseInt(string.substring(offset, end))
}
