# 0010. Exact pin for `react-aria-components`

- Status: Accepted
- Date: 2026-11-01

## Context

[0005](./0005-pass-through-react-aria-props.md) makes React Aria's props and types part of Khee's public API.
With a caret range, an app could resolve a newer `react-aria-components` than the one Khee was tested against, and our API would change without a Khee release.

A caret range would avoid duplicate copies in apps that also install React Aria.
Apps are told never to import `react-aria-components` directly, so this matters little.

What the pin actually covers, checked against `react-aria-components@1.22.1`:

- `react-aria` and `react-stately` are exact dependencies (`3.53.1` and `3.51.0`). The pin covers them too.
- These releases no longer depend on the scoped `@react-aria/*` and `@react-stately/*` packages.
- Several dependencies use caret ranges:
  - `@react-types/shared`, which defines `Key` and `Selection`
  - `@internationalized/date`, which defines `DateValue`
  - `@internationalized/string` and `@internationalized/number`
  - `clsx`, `aria-hidden`, `@swc/helpers`, `use-sync-external-store`, `client-only`

## Decision

- `@khee/react` pins `react-aria-components` to an exact version.
- Upgrades arrive as Dependabot PRs, gated by visual regression, interaction, and accessibility tests.
- Every upgrade is a Khee release, versioned by its effect on our passed-through API:
  - **Patch** if nothing in that API changed.
  - **Minor** if props or types were only added.
  - **Major** if anything broke.
- The bump is chosen by diffing the exported prop types of every wrapped component, not by React Aria's version number alone.
- Security fixes in React Aria ship promptly as their own Khee patch release.
- The README documents package-manager overrides as an emergency fallback, for apps that cannot wait for a Khee release.

## Consequences

- An app's Khee version fully determines the React Aria components and hooks it gets.
- The pin covers the public package, not the whole tree. Caret-ranged dependencies, including the ones that define `Key`, `Selection`, and `DateValue`, can float to newer minor versions in consuming apps. That is acceptable because those packages follow semver and change rarely. It also lets apps receive their security fixes without waiting for Khee.
- Khee releases more often, because every React Aria upgrade becomes a release.
- Apps that use the override fallback run an untested combination until the next Khee release.
