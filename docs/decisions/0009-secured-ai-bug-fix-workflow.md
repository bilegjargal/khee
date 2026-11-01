# 0009. A secured, label-gated AI bug-fix workflow

- Status: Accepted
- Date: 2026-11-01

## Context

An AI agent (Claude Code via its GitHub Action) can turn bug reports into tested fix PRs.
That is useful, but issue and comment text is attacker-controlled.
A naive setup risks prompt injection, secret exfiltration, workflow tampering, and an unreviewed path to npm.

Three non-obvious traps:

- **Labels are not owner-only.** Anyone with triage access can apply a label.
- **Same-repo branches run their own workflows.** The agent pushes to this repo, not a fork, so a PR that edits `.github/workflows/` would run the edited workflow with repository context.
- **PRs opened with the default `GITHUB_TOKEN` do not trigger CI**, so required checks would never run.

## Decision

1. A bug is reported as a GitHub issue.
2. The owner applies a trigger label. The workflow runs only on that label event and only when `github.actor` is the owner. It never triggers on issue creation or comments.
3. The agent writes the fix, adds tests and a patch changeset, and opens a PR.
4. CodeRabbit reviews. CI runs tests, accessibility checks, and visual regression.
5. The owner reviews and merges. The human merge is the only gate to npm.

Guardrails:

- Issue text, PR text, and comments are untrusted input, treated only as a description of the problem. Instructions inside them are never followed.
- The agent works through the Claude GitHub App, whose token triggers CI normally.
- The App's token has no `workflows` permission, so pushes that modify `.github/` are rejected. CODEOWNERS also requires the owner on `.github/`.
- The App has no publish permissions, no `id-token: write`, no npm credentials, and no bypass of `main`'s protection or rulesets.
- Agent PRs go through the same read-only, secret-free CI as every other PR (see [0008](./0008-release-and-supply-chain.md)).

## Consequences

- Bug fixes can be drafted in minutes, each with tests and a changeset.
- Visual regression catches CSS changes that look right in code but render wrong.
- A successful prompt injection can at worst produce a bad PR, which still needs owner review to merge.
- The owner remains the bottleneck by design.
