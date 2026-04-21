import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'

import { GitHubRepository } from '../../../src/models/github-repository'
import { Owner } from '../../../src/models/owner'
import { NoRemote } from '../../../src/ui/repository-settings/no-remote'
import { RepoRulesetsForBranchLink } from '../../../src/ui/repository-rules/repo-rulesets-for-branch-link'
import { fireEvent, render, screen } from '../../helpers/ui/render'

function createGitHubRepository() {
  return new GitHubRepository(
    'desktop',
    new Owner('desktop', 'https://api.github.com', 1),
    1,
    false,
    'https://github.com/desktop/desktop'
  )
}

describe('rulesets and publish surfaces', () => {
  it('renders a branch rulesets link when both repository and branch are present', () => {
    render(
      <RepoRulesetsForBranchLink
        repository={createGitHubRepository()}
        branch="feature/notifications"
      >
        View rulesets
      </RepoRulesetsForBranchLink>
    )

    const link = screen.getByRole('link', { name: 'View rulesets' })

    assert.ok(link.classList.contains('repo-rulesets-for-branch-link'))
    assert.equal(
      link.getAttribute('href'),
      'https://github.com/desktop/desktop/rules/?ref=refs%2Fheads%2Ffeature%2Fnotifications'
    )
  })

  it('renders raw children instead of a link when repository or branch are missing', () => {
    const view = render(
      <>
        <RepoRulesetsForBranchLink repository={null} branch="main">
          Missing repo
        </RepoRulesetsForBranchLink>
        <RepoRulesetsForBranchLink
          repository={createGitHubRepository()}
          branch={null}
        >
          Missing branch
        </RepoRulesetsForBranchLink>
      </>
    )

    assert.ok(view.container.textContent?.includes('Missing repo'))
    assert.ok(view.container.textContent?.includes('Missing branch'))
    assert.equal(
      view.container.querySelectorAll('.repo-rulesets-for-branch-link').length,
      0
    )
  })

  it('renders the no-remote publish call to action and invokes publish', () => {
    let publishCount = 0

    function onPublish() {
      publishCount++
    }

    const view = render(<NoRemote onPublish={onPublish} />)

    const dialogContent = view.container.querySelector('.dialog-content')
    const publishButton = screen.getByRole('button', { name: '发布' })
    const helpLink = screen.getByRole('link', { name: '点击了解远程仓库' })

    assert.notEqual(dialogContent, null)
    assert.ok(
      screen.getByText('把仓库发布到 GitHub 吧。是否需要帮助？', {
        exact: false,
      })
    )
    assert.equal(
      helpLink.getAttribute('href'),
      'https://docs.github.com/zh/get-started/getting-started-with-git/about-remote-repositories'
    )

    fireEvent.click(publishButton)

    assert.equal(publishCount, 1)
  })
})
