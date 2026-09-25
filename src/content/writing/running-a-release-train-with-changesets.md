---
title: Running a 14-package release train with Changesets
summary: How Flaghoist publishes 14 packages, and three ways the release pipeline looked fine while doing nothing.
published: 2026-09-21
tags: [flaghoist, tooling, ci]
---

Flaghoist is a monorepo that publishes 14 packages to npm: a zero-dependency core, a server, storage adapters, OpenFeature providers, Vue bindings, a CLI and an MCP server. I use Changesets to version and release them. This is the setup, followed by the part that cost time: three things that failed silently.

## The setup

The convention is that a change to a published package carries a changeset, a small file saying which packages change and by how much. When those land on `main`, the release workflow either opens a "version packages" pull request or, once that is merged, publishes.

A few settings matter most:

- `updateInternalDependencies: "patch"` bumps a dependent package when something it depends on is released, which is what keeps `core` and the packages built on it moving together.
- An `ignore` list keeps the dashboard, the docs, the website, the examples and the adapter conformance suite out of releases. They are in the repo but not on npm.

Before anything releases, CI has to pass: a format check, the typechecker, the build, `publint` and Are the Types Wrong on every package's exports, and the tests.

## Silent failure 1: renamed inputs

The release step uses `changesets/action`. Version 2 renamed two of its inputs, `version` and `publish`, to `version-script` and `publish-script`:

```yaml
- name: Create release PR or publish
  uses: changesets/action@v2
  with:
    version-script: pnpm version-packages
    publish-script: pnpm release
```

Under the old names the action still runs. It versions nothing it should not, and it never publishes, and nothing tells you.

## Silent failure 2: the token that never arrived

`actions/setup-node` with a `registry-url` writes an `.npmrc` that reads its token from `${NODE_AUTH_TOKEN}`. My secret was named `NPM_TOKEN`, and I had only set that name in the environment. So the variable in the `.npmrc` never expanded, and every request went out unauthenticated.

npm answers an unauthenticated request for a scoped package with a 404, not a 401. A 404 sends you looking for a missing package or a wrong scope, not a missing token. The fix is to pass the same secret under the name `setup-node` expects:

```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Silent failure 3: provenance that was never produced

I wanted npm provenance, the signed statement linking a published package to the workflow that built it. I set `NPM_CONFIG_PROVENANCE` and gave the job the `id-token: write` permission it needs. The 0.2.0 release published cleanly.

It printed no "Signed provenance statement" line, and the attestation endpoint returned a 404.

The reason is that `changeset publish` runs `npm pack` and then `npm publish` on the resulting tarball. npm only generates a provenance attestation when it publishes from the package directory, not from a pre-packed tarball. This is a known changesets limitation, [changesets#1152](https://github.com/changesets/changesets/issues/1152).

The trouble was seeing it at all. Changesets runs `npm publish --json` with stdout piped and throws the output away on success, so whatever npm said about provenance went nowhere. I added a manual workflow that publishes nothing and only reports what npm sees, whether provenance is turned on and whether it can reach the OIDC token, inside the same environment the release runs in.

## Where it stands

Provenance is not working yet. The workflow says so in a comment, next to the setting that does nothing, so nobody assumes it is. The two ways forward are to publish each package from its own directory with plain `npm publish`, or to wait for changesets to support it. The `id-token: write` permission is already in place for when that happens.

## What I would keep

All three failures share a shape: the pipeline reported success while doing less than it claimed. The habit I took from it is to treat a green release as unproven until the package is on the registry with the metadata I expected, and to write down, in the workflow itself, why each odd setting is there.
