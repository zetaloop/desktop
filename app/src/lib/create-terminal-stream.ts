import { Transform } from 'node:stream'

export const createTerminalStream = () => {
  const capacity = 1024
  let buf = Buffer.alloc(capacity)
  let l = 0
  let p = 0

  function reset() {
    buf = Buffer.alloc(capacity)
    p = 0
    l = 0
  }

  return new Transform({
    decodeStrings: true,
    transform(chunk: Buffer, _, callback) {
      for (const c of chunk) {
        if (c === 0x0a /* \n */ || l === buf.length - 1) {
          this.push(Buffer.concat([buf.subarray(0, l), Buffer.from([c])]))
          reset()
        } else if (c === 0x0d /* \r */) {
          p = 0
        } else {
          buf.writeUInt8(c, p++)
          l = Math.max(p, l)
        }
      }

      callback()
    },
    flush(callback) {
      callback(null, l > 0 ? buf.subarray(0, l) : null)
    },
  })
}
