import { describe, it } from 'node:test'
import assert from 'node:assert'
import { AppFileStatusKind } from '../../src/models/status'
import { DiffSelectionType } from '../../src/models/diff'
import { WorkingDirectoryFileChange } from '../../src/models/status'
import { DiffSelection } from '../../src/models/diff'
import {
  applyFilterOptions,
  isCommittingFileHiddenByFilter,
  getNoResultsMessage,
} from '../../src/ui/changes/filter-changes-logic'
import { IFileListFilterState } from '../../src/lib/app-state'
import { IChangesListItem } from '../../src/ui/changes/filter-changes-list'

// Helper function to create a test file
function createTestFile(
  path: string,
  kind:
    | AppFileStatusKind.New
    | AppFileStatusKind.Modified
    | AppFileStatusKind.Deleted,
  selectionType: DiffSelectionType
): WorkingDirectoryFileChange {
  const selection =
    selectionType === DiffSelectionType.Partial
      ? DiffSelection.fromInitialSelection(
          DiffSelectionType.All
        ).withLineSelection(0, false)
      : DiffSelection.fromInitialSelection(
          selectionType as DiffSelectionType.All | DiffSelectionType.None
        )
  return new WorkingDirectoryFileChange(path, { kind }, selection)
}

// Helper function to create a test changes list item
function createTestItem(
  path: string,
  status:
    | AppFileStatusKind.New
    | AppFileStatusKind.Modified
    | AppFileStatusKind.Deleted,
  selectionType: DiffSelectionType
): IChangesListItem {
  const change = createTestFile(path, status, selectionType)
  return {
    id: path,
    text: [path],
    change,
  }
}

describe('filter-changes-logic', () => {
  describe('applyFilterOptions', () => {
    describe('when no filters are active', () => {
      it('should show all files', () => {
        const filters: IFileListFilterState = {
          filterText: '',
          isIncludedInCommit: false,
          isExcludedFromCommit: false,
          isNewFile: false,
          isModifiedFile: false,
          isDeletedFile: false,
        }

        const newFile = createTestItem(
          'new.txt',
          AppFileStatusKind.New,
          DiffSelectionType.All
        )
        const modifiedFile = createTestItem(
          'modified.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        )
        const deletedFile = createTestItem(
          'deleted.txt',
          AppFileStatusKind.Deleted,
          DiffSelectionType.All
        )

        assert.equal(applyFilterOptions(newFile, filters), true)
        assert.equal(applyFilterOptions(modifiedFile, filters), true)
        assert.equal(applyFilterOptions(deletedFile, filters), true)
      })
    })

    describe('when using AND logic', () => {
      it('should show files matching ALL active filters', () => {
        const filters: IFileListFilterState = {
          filterText: '',
          isIncludedInCommit: true,
          isExcludedFromCommit: false,
          isNewFile: true,
          isModifiedFile: false,
          isDeletedFile: false,
        }

        // Staged new file - matches both filters
        const stagedNewFile = createTestItem(
          'staged-new.txt',
          AppFileStatusKind.New,
          DiffSelectionType.All
        )
        // Unstaged new file - doesn't match included filter
        const unstagedNewFile = createTestItem(
          'unstaged-new.txt',
          AppFileStatusKind.New,
          DiffSelectionType.None
        )
        // Staged modified file - doesn't match new file filter
        const stagedModifiedFile = createTestItem(
          'staged-modified.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        )

        assert.equal(applyFilterOptions(stagedNewFile, filters), true)
        assert.equal(applyFilterOptions(unstagedNewFile, filters), false)
        assert.equal(applyFilterOptions(stagedModifiedFile, filters), false)
      })

      it('should handle conflicting filters correctly', () => {
        const filters: IFileListFilterState = {
          filterText: '',
          isIncludedInCommit: true,
          isExcludedFromCommit: true, // Both can't be true at same time
          isNewFile: false,
          isModifiedFile: false,
          isDeletedFile: false,
        }

        const stagedFile = createTestItem(
          'staged.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        )
        const unstagedFile = createTestItem(
          'unstaged.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.None
        )

        // No file can be both staged and unstaged
        assert.equal(applyFilterOptions(stagedFile, filters), false)
        assert.equal(applyFilterOptions(unstagedFile, filters), false)
      })
    })
  })

  describe('isCommittingFileHiddenByFilter', () => {
    it('should return false when no filters are active', () => {
      const filters: IFileListFilterState = {
        filterText: '',
        isIncludedInCommit: false,
        isExcludedFromCommit: false,
        isNewFile: false,
        isModifiedFile: false,
        isDeletedFile: false,
      }

      const fileIds = ['file1', 'file2']
      const filteredItems = new Map([
        ['file1', {} as IChangesListItem],
        ['file2', {} as IChangesListItem],
      ])

      assert.equal(
        isCommittingFileHiddenByFilter(fileIds, filteredItems, 2, filters),
        false
      )
    })

    it('should return true when committing files not in filtered list', () => {
      const filters: IFileListFilterState = {
        filterText: '',
        isIncludedInCommit: true,
        isExcludedFromCommit: false,
        isNewFile: false,
        isModifiedFile: false,
        isDeletedFile: false,
      }

      const fileIds = ['file1', 'file2', 'file3']
      const filteredItems = new Map([
        ['file1', {} as IChangesListItem],
        ['file2', {} as IChangesListItem],
      ])

      assert.equal(
        isCommittingFileHiddenByFilter(fileIds, filteredItems, 5, filters),
        true
      )
    })
  })

  describe('getNoResultsMessage', () => {
    it('should return undefined when no filters active', () => {
      const filters: IFileListFilterState = {
        filterText: '',
        isIncludedInCommit: false,
        isExcludedFromCommit: false,
        isNewFile: false,
        isModifiedFile: false,
        isDeletedFile: false,
      }

      assert.equal(getNoResultsMessage(filters), undefined)
    })

    it('should return message with text filter', () => {
      const filters: IFileListFilterState = {
        filterText: 'test',
        isIncludedInCommit: false,
        isExcludedFromCommit: false,
        isNewFile: false,
        isModifiedFile: false,
        isDeletedFile: false,
      }

      const message = getNoResultsMessage(filters)
      assert(message?.includes('"test"'))
    })

    it('should return message with multiple filters', () => {
      const filters: IFileListFilterState = {
        filterText: '',
        isIncludedInCommit: true,
        isExcludedFromCommit: false,
        isNewFile: true,
        isModifiedFile: false,
        isDeletedFile: false,
      }

      const message = getNoResultsMessage(filters)
      assert(message?.includes('将要提交'))
      assert(message?.includes('属于新增'))
    })
  })
})
