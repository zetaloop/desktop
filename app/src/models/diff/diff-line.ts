/** indicate what a line in the diff represents */
export enum DiffLineType {
  Context,
  Add,
  Delete,
  Hunk,
}

/** track details related to each line in the diff */
export class DiffLine {
  public constructor(
    public readonly text: string,
    public readonly type: DiffLineType,
    // Line number in the original diff patch (before expanding it), or null if
    // it was added as part of a diff expansion action.
    public readonly originalLineNumber: number | null,
    public readonly oldLineNumber: number | null,
    public readonly newLineNumber: number | null,
    public readonly noTrailingNewLine: boolean = false,
    /**
     * Pre-computed inline changed character ranges from difftastic.
     * Each tuple is [characterOffset, length] within the line content.
     */
    public readonly inlineChangedRanges?: ReadonlyArray<
      readonly [number, number]
    >
  ) {}

  public withNoTrailingNewLine(noTrailingNewLine: boolean): DiffLine {
    return new DiffLine(
      this.text,
      this.type,
      this.originalLineNumber,
      this.oldLineNumber,
      this.newLineNumber,
      noTrailingNewLine,
      this.inlineChangedRanges
    )
  }

  public isIncludeableLine() {
    return this.type === DiffLineType.Add || this.type === DiffLineType.Delete
  }

  /** The content of the line, i.e., without the line type marker. */
  public get content(): string {
    return this.text.substring(1)
  }

  public equals(other: DiffLine) {
    return (
      this.text === other.text &&
      this.type === other.type &&
      this.originalLineNumber === other.originalLineNumber &&
      this.oldLineNumber === other.oldLineNumber &&
      this.newLineNumber === other.newLineNumber &&
      this.noTrailingNewLine === other.noTrailingNewLine &&
      this.inlineChangedRanges?.length === other.inlineChangedRanges?.length &&
      this.inlineChangedRanges?.every(
        ([offset, length], index) =>
          offset === other.inlineChangedRanges?.[index]?.[0] &&
          length === other.inlineChangedRanges?.[index]?.[1]
      ) !== false
    )
  }
}
