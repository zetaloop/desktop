import { describe, it } from 'node:test'
import assert from 'node:assert'
import { formatPreciseDuration } from '../../src/lib/format-duration'

describe('formatPreciseDuration', () => {
  it('returns 0s for ms less than 1000', () => {
    assert.equal(formatPreciseDuration(1), '0秒')
  })

  it('return 0[unit] after encountering first whole unit', () => {
    assert.equal(formatPreciseDuration(86400000), '1天0小时0分钟0秒')
    assert.equal(formatPreciseDuration(3600000), '1小时0分钟0秒')
    assert.equal(formatPreciseDuration(60000), '1分钟0秒')
    assert.equal(formatPreciseDuration(1000), '1秒')
  })

  it('treats negative values as absolute numbers', () => {
    assert.equal(formatPreciseDuration(-1000), '1秒')
  })
})
