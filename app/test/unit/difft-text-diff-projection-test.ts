import { describe, it } from 'node:test'
import assert from 'node:assert'
import { DiffLineType } from '../../src/models/diff'
import { projectDifftTextDiff } from '../../src/lib/difft/desktop-text-diff-projection'

describe('projectDifftTextDiff', () => {
  it('projects mixed edits into delete and add line pairs', () => {
    const result = projectDifftTextDiff({
      payload: {
        status: 'changed',
        aligned_lines: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        chunks: [
          [
            {
              lhs: {
                line_number: 1,
                changes: [{ content: 'before = 1' }],
              },
              rhs: {
                line_number: 1,
                changes: [{ content: 'after = 2' }],
              },
            },
          ],
        ],
      },
      oldText: 'context before\nbefore = 1\ncontext after\n',
      newText: 'context before\nafter = 2\ncontext after\n',
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    const [hunk] = result.diff.hunks
    assert.ok(hunk)
    assert.deepEqual(
      hunk.lines.map(line => ({
        text: line.text,
        type: line.type,
        oldLineNumber: line.oldLineNumber,
        newLineNumber: line.newLineNumber,
      })),
      [
        {
          text: '@@ -1,3 +1,3 @@',
          type: DiffLineType.Hunk,
          oldLineNumber: null,
          newLineNumber: null,
        },
        {
          text: ' context before',
          type: DiffLineType.Context,
          oldLineNumber: 1,
          newLineNumber: 1,
        },
        {
          text: '-before = 1',
          type: DiffLineType.Delete,
          oldLineNumber: 2,
          newLineNumber: null,
        },
        {
          text: '+after = 2',
          type: DiffLineType.Add,
          oldLineNumber: null,
          newLineNumber: 2,
        },
        {
          text: ' context after',
          type: DiffLineType.Context,
          oldLineNumber: 3,
          newLineNumber: 3,
        },
      ]
    )
    assert.equal(result.diff.text, hunk.lines.map(line => line.text).join('\n'))
    assert.equal(result.diff.maxLineNumber, 3)
  })

  it('accepts array payloads and preserves add and delete rows', () => {
    const result = projectDifftTextDiff({
      payload: [
        {
          status: 'changed',
          aligned_lines: [
            [0, 0],
            [1, null],
            [null, 1],
          ],
          chunks: [
            [
              {
                lhs: {
                  line_number: 1,
                  changes: [{ content: 'removed line' }],
                },
              },
              {
                rhs: {
                  line_number: 1,
                  changes: [{ content: 'added line' }],
                },
              },
            ],
          ],
        },
      ],
      oldText: 'shared\nremoved line\n',
      newText: 'shared\nadded line\n',
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    const lines = result.diff.hunks[0].lines
    assert.equal(lines[1].type, DiffLineType.Context)
    assert.equal(lines[2].type, DiffLineType.Delete)
    assert.equal(lines[3].type, DiffLineType.Add)
    assert.equal(lines[2].oldLineNumber, 2)
    assert.equal(lines[3].newLineNumber, 2)
  })

  it('preserves the last logical line when source text lacks a trailing newline', () => {
    const result = projectDifftTextDiff({
      payload: {
        status: 'changed',
        aligned_lines: [
          [0, 0],
          [1, 1],
        ],
        chunks: [
          [
            {
              lhs: {
                line_number: 0,
                changes: [{ content: 'before = 1' }],
              },
              rhs: {
                line_number: 0,
                changes: [{ content: 'after = 2' }],
              },
            },
          ],
        ],
      },
      oldText: 'before = 1\nfinal context',
      newText: 'after = 2\nfinal context',
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    const lines = result.diff.hunks[0].lines
    assert.equal(lines[3].text, ' final context')
    assert.equal(lines[3].type, DiffLineType.Context)
    assert.equal(lines[3].oldLineNumber, 2)
    assert.equal(lines[3].newLineNumber, 2)
  })

  it('returns a typed failure for unexpected file counts', () => {
    const result = projectDifftTextDiff({
      payload: [{ status: 'changed' }, { status: 'changed' }],
    })

    assert.deepEqual(result, {
      kind: 'failure',
      reason: 'unexpected-file-count',
      message: 'Expected a single difft file payload but received 2',
    })
  })
})
