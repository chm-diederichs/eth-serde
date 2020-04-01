const crypto = require('crypto')
const tape = require('tape')
const parse = require('./parse')
const serde = require('./')
const array = require('./array')
const lib = require('./lib')
const vectors = require('./vectors.json')

tape('library functions: int', function (t) {
  var { encode, decode } = lib.int

  const one = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
  const negOne = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')

  // encode
  t.same(encode(0), Buffer.alloc(32))
  t.same(encode(1), one)
  t.same(encode(-1), negOne)

  // bigint and number equivalence
  t.same(encode(0), encode(0n))
  t.same(encode(21627), encode(21627n))
  t.same(encode(-1, 32), encode(-1n, 32))

  for (let i = 1; i < 33; i++) {
    t.same(encode(-1, 8 * i), negOne)

    var expected = Buffer.alloc(32)
    expected.fill(0xff, 32 - i)
    expected[32 - i] = 0x7f
    t.same(encode(256n ** BigInt(i) / 2n - 1n, 8 * i), expected)
    
    t.throws(() => encode(256n ** BigInt(i) / 2n, 8 * i))
    t.doesNotThrow(() => encode(-(256n ** BigInt(i) / 2n), 8 * i))
    t.throws(() => encode(-(256n ** BigInt(i) / 2n + 1), 8 * i))
  }

  t.throws(() => encode(null))
  t.throws(() => encode('0x'))
  t.throws(() => encode('hello'))
  t.throws(() => encode('abcdef'))
  t.throws(() => encode([1234]))

  // decode
  t.same(decode(Buffer.alloc(32)), 0n)
  t.same(decode(one), 1n)
  t.same(decode(negOne), -1n)

  var aa = 0xaan
  for (let i = 1; i < 33; i++) {
    t.same(decode(8 * i, negOne), -1n)

    var test = Buffer.alloc(32)
    test.fill(0xff, 32 - i)
    test[32 - i] = 0x7f
    t.same(decode(8 * i, test), 2n ** (8n * BigInt(i) - 1n) - 1n)

    test.fill(0)
    test.fill(0xff, 0, i)
    test.fill(0xaa, 32 - i)
    t.same(decode(8 * i, test), aa - 2n ** (8n * BigInt(i)))
    aa = aa * 256n + 0xaan
  }

  t.end()
})

tape('library functions: uint', function (t) {
  var { encode, decode } = lib.uint

  const one = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
  const max = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')

  // encode
  t.same(encode(0), Buffer.alloc(32))
  t.same(encode(1), one)
  t.same(encode(256n ** 32n -1n), max)

  // bigint and number equivalence
  t.same(encode(0), encode(0n))
  t.same(encode(21627), encode(21627n))
  t.same(encode(0xffffffff, 32), encode(0xffffffffn, 32))

  for (let i = 1; i < 33; i++) {
    var expected = Buffer.alloc(32)
    expected.fill(0xff, 32 - i)
    t.same(encode(256n ** BigInt(i) - 1n, 8 * i), expected)

    t.throws(() => encode(256n ** BigInt(i), 8 * i))
    t.throws(() => encode(-1, 8 * i))
  }

  t.throws(() => encode(null))
  t.throws(() => encode('0x'))
  t.throws(() => encode('hello'))
  t.throws(() => encode('abcdef'))
  t.throws(() => encode([1234]))

  // decode
  t.same(decode(Buffer.alloc(32)), 0n)
  t.same(decode(one), 1n)
  t.same(decode(max), 256n ** 32n - 1n)

  var aa = 0xaan
  for (let i = 1; i < 33; i++) {
    var test = Buffer.alloc(32)
    test.fill(0xff, 32 - i)
    t.same(decode(8 * i, test), 256n ** BigInt(i) - 1n)

    test[32 - i] = 0x7f
    t.same(decode(8 * i, test), 256n ** BigInt(i) / 2n - 1n)

    test.fill(0)
    test.fill(0xaa, 32 - i)
    t.same(decode(8 * i, test), aa)
    aa = aa * 256n + 0xaan
  }

  t.end()
})

tape('library functions: bytes', function (t) {
  var { encode, decode } = lib.bytes

  var buf = Buffer.from('testing')
  var static = Buffer.concat([buf, Buffer.alloc(25)])
  var dynamic = Buffer.alloc(64)
  dynamic[31] = 0x07
  dynamic.set(buf, 32)

  // encode
  t.same(encode(buf, 7), static)
  t.same(encode(buf), dynamic)


  t.same(decode(7, static), buf)
  t.same(decode(dynamic), buf)

  t.throws(() => encode(Buffer.alloc(0), 0))
  t.throws(() => encode(Buffer.alloc(0)))

  t.throws(() => encode('hi'))
  t.throws(() => encode(['hi']))
  t.throws(() => encode(1))
  t.throws(() => encode([1]))

  t.end()
})

tape('library functions: address', function (t) {
  var { encode, decode } = lib.address

  var test = Buffer.from('0000000000000000000000000005b7d915458ef540ade6068dfe2f44e8fa733c', 'hex')
  var addr = '0x0005b7d915458ef540ade6068dfe2f44e8fa733c'

  t.same(encode(addr), test)
  t.same(decode(test), addr)

  t.throws(() => encode(BigInt(addr)))

  t.end()
})

tape('library functions: bool', function (t) {
  var { encode, decode } = lib.bool

  const trueBuf = Buffer.alloc(32)
  trueBuf[31] = 0x01

  t.same(encode(false), Buffer.alloc(32))
  t.same(encode(true), trueBuf)

  t.ok(decode(trueBuf))
  t.notOk(decode(Buffer.alloc(32)))

  t.throws(() => encode(1))
  t.throws(() => encode('1'))
  t.throws(() => encode('true'))
  t.throws(() => encode([true]))

  t.end()
})

tape('library functions: string', function (t) {
  var { encode, decode } = lib.string

  var str = 'a quick brown fox jumped over the lazy dog.'
  var buf = Buffer.alloc(96)
  buf[31] = 43
  buf.set(Buffer.from(str), 32)

  t.same(encode(str), buf)
  t.same(decode(buf), str)
  
  t.throws(() => encode(1))
  t.throws(() => encode(false))
  t.throws(() => encode(4389n))
  t.throws(() => encode([true]))

  t.end()
})

tape('library functions: fixed', function (t) {
  var { encode, decode } = lib.fixed

  const nums = []

  var num = 1n
  var max = 256n ** 32n

  for (let i = 0; i < 32; i++) {
    var buf = Buffer.from(num.toString(16).padStart(64, '0'), 'hex')
    var neg = Buffer.from((max - num).toString(16).padStart(64, '0'), 'hex')
    nums.push(buf)
    nums.push(neg)
    num *= 10n

    t.same(encode(1, i), buf)
    t.same(encode(-1, i), neg)
  }

  for (let i = 0n; i < 64n; i += 2n) {
    t.same(decode(i / 2n, nums[i]), 1n)
    t.same(decode(i / 2n, nums[i + 1n]), -1n)
  }

  t.throws(() => encode('1'))
  t.throws(() => encode(false))
  t.throws(() => encode([true]))

  t.end()
})

tape('library functions: ufixed', function (t) {
  var { encode, decode } = lib.ufixed

  const nums = []

  var num = 1n
  for (let i = 0; i < 32; i++) {
    var buf = Buffer.from(num.toString(16).padStart(64, '0'), 'hex')
    nums.push(buf)
    num *= 10n

    t.same(encode(1, i), buf)
  }

  for (let i = 0n; i < 32n; i++) {
    t.same(decode(i, nums[i]), 1n)
  }

  t.throws(() => encode('1'))
  t.throws(() => encode(false))
  t.throws(() => encode([true]))

  t.end()
})

tape('library functions: array', function (t) {
  var { encode, decode } = array

  var test = [-1n, -2n, -3n, -4n, -5n]
  var utest = [1n, 2n, 3n, 4n, 5n]

  for (let i = 8; i < 256; i += 8) {
    var enc = { opts: [i], array: true, arrayLength: 5 }
    var uenc = { opts: [i], array: true, arrayLength: 5 }
    var denc = { opts: [i], array: true, arrayLength: -1 }
    var duenc = { opts: [i], array: true, arrayLength: -1 }

    enc.type = 'int'
    denc.type = 'int'
    uenc.type = 'uint'
    duenc.type = 'uint'

    var encoded = encode(test, enc)
    var decoded = decode(enc, encoded)

    var uencoded = encode(utest, uenc)
    var udecoded = decode(uenc, uencoded)

    var dencoded = encode(test, denc)
    var ddecoded = decode(denc, dencoded)

    var duencoded = encode(utest, duenc)
    var dudecoded = decode(duenc, duencoded)

    t.same(decoded, test)
    t.same(udecoded, utest)
    t.same(ddecoded, test)
    t.same(dudecoded, utest)
  }

  t.end()
})

tape('tuple encoding', function (t) {
  for (let vector of vectors) {
    var args = vector.args.map(parseJsonBuffer)
    // console.log(args)
    t.same(serde.encode(args, vector.signature), Buffer.from(vector.enc, 'hex'))
  }

  t.end()

  function parseJsonBuffer (arg) {
    if (arg.type === 'Buffer') {
      return Buffer.from(arg.data)
    } else if (arg instanceof Array) {
      return arg.map(parseJsonBuffer)
    } else {
      return arg
    }
  }
})


// var sig = ['uint256[]', 'uint256', 'bytes4[2]', 'bytes4', 'uint256']
// var data = [[0x217827138920938901290abcdefeded17291, 3029933439840834n], 3333408308450n, [Buffer.alloc(4), Buffer.alloc(4, 1)], Buffer.alloc(4, 2), 12723454937939n]

// var enc = serde.encode(data, sig)
// console.log(enc.subarray(0,32))
// var dec = serde.decode(sig, enc)
// console.log(dec)


// var test = uint.encode(0x30404, 256)
// console.log(test)
// var testd = uint.decode(test)
// console.log(testd)
