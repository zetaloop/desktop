import { Readable } from 'stream'
import { createTailStream } from '../../../src/lib/git/create-tail-stream'

describe('createTailStream', () => {
  it('only keeps the tail of the input stream', async () => {
    const write = (maxLength: number, ...chunks: string[]) =>
      Readable.from(chunks)
        .pipe(createTailStream(maxLength, { encoding: 'utf8' }))
        .toArray()

    expect(await write(3, 'hello')).toEqual(['llo'])
    expect(await write(5, 'hello')).toEqual(['hello'])
    expect(await write(10, 'hello', 'world')).toEqual(['helloworld'])
    expect(await write(8, 'hello', 'world')).toEqual(['lloworld'])
    expect(
      await write(10, '0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
    ).toEqual(['0123456789'])
    expect(
      await write(8, '0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
    ).toEqual(['23456789'])

    expect(await write(8, ...'helloworld')).toEqual(['lloworld'])
  })
})
