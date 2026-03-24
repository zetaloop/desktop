import assert from 'node:assert'
import { describe, it } from 'node:test'

import {
  DiffType,
  getDifftRenderFailure,
  getDifftRenderedLanguage,
  isDifftRenderedDiff,
  type ITextDiff,
} from '../../src/models/diff'
import { textDiffEquals } from '../../src/ui/diff/diff-helpers'

function createTextDiff(overrides: Partial<ITextDiff> = {}): ITextDiff {
  return {
    kind: DiffType.Text,
    text: '',
    hunks: [],
    maxLineNumber: 0,
    hasHiddenBidiChars: false,
    renderedByDifft: false,
    renderedByDifftLanguage: null,
    difftRenderFailure: null,
    ...overrides,
  }
}

describe('difft render state helpers', () => {
  it('surfaces success language only when the diff was rendered by difft', () => {
    const diff = createTextDiff({
      renderedByDifft: true,
      renderedByDifftLanguage: 'YAML',
    })

    assert.equal(isDifftRenderedDiff(diff), true)
    assert.equal(getDifftRenderedLanguage(diff), 'YAML')
    assert.equal(getDifftRenderFailure(diff), null)
  })

  it('surfaces failure reason without pretending the fallback result was rendered by difft', () => {
    const diff = createTextDiff({
      difftRenderFailure: '2 YAML parse errors, exceeded DFT_PARSE_ERROR_LIMIT',
    })

    assert.equal(isDifftRenderedDiff(diff), false)
    assert.equal(getDifftRenderedLanguage(diff), null)
    assert.equal(
      getDifftRenderFailure(diff),
      '2 YAML parse errors, exceeded DFT_PARSE_ERROR_LIMIT'
    )
  })

  it('treats render-state changes as structural diff changes', () => {
    const base = createTextDiff()
    const rendered = createTextDiff({
      renderedByDifft: true,
      renderedByDifftLanguage: 'TypeScript TSX',
    })
    const failed = createTextDiff({
      difftRenderFailure: 'process exploded',
    })

    assert.equal(textDiffEquals(base, rendered), false)
    assert.equal(textDiffEquals(rendered, failed), false)
  })
})
