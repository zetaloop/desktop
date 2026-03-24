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

  it('surfaces structural language metadata for accepted difft results', () => {
    const result = projectDifftTextDiff({
      payload: {
        language: 'TSX',
        status: 'changed',
        aligned_lines: [[0, 0]],
        chunks: [],
      },
      oldText: 'const before = 1\n',
      newText: 'const after = 1\n',
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    assert.deepEqual(result.metadata, {
      language: 'TSX',
      languageKind: 'structural',
      status: 'changed',
    })
  })

  it('classifies plain text fallback metadata from difft language output', () => {
    const result = projectDifftTextDiff({
      payload: {
        language:
          'Text (2 TypeScript parse error(s), exceeded DFT_PARSE_ERROR_LIMIT)',
        status: 'changed',
        aligned_lines: [[0, 0]],
        chunks: [],
      },
      oldText: 'before\n',
      newText: 'after\n',
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    assert.equal(result.metadata.languageKind, 'plain-text-fallback')
    assert.equal(
      result.metadata.language,
      'Text (2 TypeScript parse error(s), exceeded DFT_PARSE_ERROR_LIMIT)'
    )
  })

  it('preserves created status metadata for later git fallback decisions', () => {
    const result = projectDifftTextDiff({
      payload: {
        language: 'TypeScript',
        status: 'created',
      },
      newText: 'export const x = 1\n',
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    assert.deepEqual(result.metadata, {
      language: 'TypeScript',
      languageKind: 'structural',
      status: 'created',
    })
  })

  it('converts difft byte offsets into stable inline ranges for CJK text', () => {
    const result = projectDifftTextDiff({
      payload: {
        language: 'TSX',
        status: 'changed',
        aligned_lines: [[0, 0]],
        chunks: [
          [
            {
              lhs: {
                line_number: 0,
                changes: [{ start: 16, end: 35, content: '提示: 您可使用' }],
              },
              rhs: {
                line_number: 0,
                changes: [{ start: 16, end: 35, content: '提示: 您可使用' }],
              },
            },
          ],
        ],
      },
      oldText: "              提示: 您可使用{' '}\n",
      newText: "              提示: 您可使用{' '}\n",
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    const deleteLine = result.diff.hunks[0].lines[1]
    const addLine = result.diff.hunks[0].lines[2]

    assert.deepEqual(deleteLine.inlineChangedRanges, [[15, 8]])
    assert.deepEqual(addLine.inlineChangedRanges, [[15, 8]])
  })

  it('preserves absolute original diff line numbers across multiple hunks', () => {
    const result = projectDifftTextDiff({
      payload: {
        status: 'changed',
        aligned_lines: [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
          [6, 6],
          [7, 7],
          [8, 8],
          [9, 9],
        ],
        chunks: [
          [
            {
              lhs: {
                line_number: 1,
                changes: [{ content: 'before one' }],
              },
              rhs: {
                line_number: 1,
                changes: [{ content: 'after one' }],
              },
            },
          ],
          [
            {
              lhs: {
                line_number: 8,
                changes: [{ content: 'before two' }],
              },
              rhs: {
                line_number: 8,
                changes: [{ content: 'after two' }],
              },
            },
          ],
        ],
      },
      oldText: [
        'context 1',
        'before one',
        'context 3',
        'context 4',
        'context 5',
        'context 6',
        'context 7',
        'context 8',
        'before two',
        'context 10',
      ].join('\n'),
      newText: [
        'context 1',
        'after one',
        'context 3',
        'context 4',
        'context 5',
        'context 6',
        'context 7',
        'context 8',
        'after two',
        'context 10',
      ].join('\n'),
    })

    assert.equal(result.kind, 'success')
    if (result.kind !== 'success') {
      return
    }

    const [firstHunk, secondHunk] = result.diff.hunks
    assert.ok(firstHunk)
    assert.ok(secondHunk)
    assert.deepEqual(
      firstHunk.lines.map(line => line.originalLineNumber),
      [1, 1, 2, 3, 4, 5, 6]
    )
    assert.deepEqual(
      secondHunk.lines.map(line => line.originalLineNumber),
      [1, 8, 9, 10, 11, 12, 13]
    )
    assert.equal(secondHunk.unifiedDiffStart, firstHunk.lines.length)
  })
})
