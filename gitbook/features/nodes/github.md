# `GitHub` Node — *Integrations*

> Repository operations: PRs, issues, commits, branches, file contents.

## What it does

Direct GitHub API integration. Use it whenever a workflow needs to **read**
or **write** repo state — list PRs, fetch a file, open an issue, comment on
a PR, dispatch a workflow.

For richer LLM-driven repo automation (review PRs, triage issues with
reasoning), use [`claude-github-pipeline`](./claude-github-pipeline.md) instead.

## Inputs

| Field        | Type     | Required | Description                                   |
| ------------ | -------- | -------- | --------------------------------------------- |
| `repo`       | `string` | yes      | `owner/name`                                  |
| `prNumber`   | `number` | for PR ops | Pull request id                             |
| `issueNumber`| `number` | for issue ops | Issue id                                |
| `path`       | `string` | for file ops | File path in the repo                    |
| `body`       | `string` | for comment/issue create | Markdown content              |
| `title`      | `string` | for issue create | Issue title                          |
| `labels`     | `string[]` | optional | Labels to apply                             |

## Outputs

Shape depends on the action. All actions return `{ ok, data, rateLimit }`.

| Action            | `data` shape                                       |
| ----------------- | -------------------------------------------------- |
| `getPR`           | `{ number, title, body, head, base, mergeable }`   |
| `listCommits`     | `{ commits: Commit[] }`                            |
| `getFile`         | `{ content, encoding, sha }`                       |
| `createIssue`     | `{ number, htmlUrl }`                              |
| `commentPR`       | `{ id, htmlUrl }`                                  |

## Configuration

| Field        | Type     | Default     | Description                                   |
| ------------ | -------- | ----------- | --------------------------------------------- |
| `action`     | enum     | required    | `getPR` / `listCommits` / `getFile` / `createIssue` / `commentPR` / etc. |
| `account`    | string   | required    | The GitHub PAT to use (from API Keys panel)   |

## Authentication

GitHub Personal Access Token. Required scopes depend on action:
- `repo` for private repo read/write
- `public_repo` for public repos
- `workflow` to dispatch GitHub Actions

The PAT is encrypted via the secrets vault (issue #6).

## Example workflow

```
Trigger (webhook: GitHub PR opened) → GitHub (getPR) → UniversalAgent (review) → GitHub (commentPR)
```

When a PR opens, fetch its diff, run a Claude review, post the review as a
PR comment.

## Common errors

| Error                              | Cause                       | Fix                                          |
| ---------------------------------- | --------------------------- | -------------------------------------------- |
| `401 Bad credentials`              | PAT revoked or expired      | Generate a new PAT, update via API Keys      |
| `403 Resource not accessible`      | Missing scope               | Add the required scope to the PAT            |
| `404 Not Found`                    | Repo or PR doesn't exist    | Check `repo` and `prNumber`                  |
| `422 Validation failed`            | Bad input (e.g., bad ref)   | Inspect run log for the specific field       |

## Cost

Free. Subject to GitHub's API rate limits (5,000 req/hour for authenticated).

## Related nodes

- [`claude-github-pipeline`](./claude-github-pipeline.md) — high-level repo automation
- [`router`](./router.md) — branch on PR state (mergeable, has-conflicts)
- [`gmail`](./gmail.md) — email PR digests
