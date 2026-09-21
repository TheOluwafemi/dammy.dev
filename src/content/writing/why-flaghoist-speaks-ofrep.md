---
title: Why Flaghoist speaks OFREP instead of shipping SDKs
summary: One protocol implementation instead of a client per language, how I checked that claim, and the bug the Go provider found.
published: 2026-09-21
tags: [flaghoist, openfeature, testing]
---

The obvious way to support many languages is to write an SDK for each one. For a project with one maintainer, that is a permanent tax: every language is another release process, another set of bugs and another thing to keep in step with the server.

Flaghoist takes the other route. The server implements the read path of the OpenFeature Remote Evaluation Protocol (OFREP), so any OpenFeature SDK that has an OFREP provider can talk to it. I did not write a client for any of them.

That is a claim about a protocol, and protocols are where "should work" and "does work" come apart. This is how I checked it, and what the check found.

## Is there anything to install?

Before installing a toolchain, confirm the provider exists. I checked each language's own registry rather than a search API:

| Language | Package | Version tested |
| --- | --- | --- |
| JavaScript | `@openfeature/ofrep-provider` | in use |
| Go | `github.com/open-feature/go-sdk-contrib/providers/ofrep` | v0.1.7 |
| Python | `openfeature-provider-ofrep` | 0.3.0 |
| Java | `dev.openfeature.contrib.providers:ofrep` | 0.0.2 |
| .NET | `OpenFeature.Providers.Ofrep` | 0.1.5 |
| Ruby | `openfeature-ofrep-provider` | 0.1.2 |
| Rust | `open-feature-ofrep` | 0.1.2 |

PHP is missing from that table because there is nothing to put in it. The PHP contrib repository ships providers for CloudBees, Flagd, Flagsmith, GoFeatureFlag and Split, and none for OFREP. My landing page had a PHP badge, which was a promise the ecosystem could not keep. I removed it.

Notice the version numbers. Java at 0.0.2 and Ruby and Rust at 0.1.x are early releases, so a pass today is a statement about that version on that day, not about the language.

## The check

For each language: a throwaway Flaghoist deployment, so the flag state is known, and six assertions. They include starting the provider against a server that has no `/ofrep/v1/configuration` endpoint, evaluating a disabled flag, matching a targeting rule on `plan=pro` and not matching it without, asking for a key that does not exist, and using a wrong API key.

Before running any of it, the biggest worry was systemic. If the Go provider refused to initialise without a configuration endpoint, every language would probably fail the same way at once. It did not. That assertion passed everywhere.

## What Go found

The third assertion failed in Go, and it was not a transport bug.

For a disabled flag, the server sent `value: false, reason: DISABLED`. The JavaScript provider honoured the value. The Go provider read `DISABLED` as "this flag is not participating, use your own default". The same flag on the same server was false in one language and true in the other.

It lands on the kill switch, the pattern where being wrong costs the most. A Go service written as `BooleanValue(ctx, "feature", true)` kept serving a feature after it had been switched off, while the dashboard showed it off.

The fix was to report `STATIC` on the wire. `evaluate()` still returns `DISABLED` internally and the admin API is unchanged. After that, both languages returned false whatever default the caller passed.

That is the reason to keep running the other five. One provider reading a spec differently from another is invisible until two of them are pointed at the same server.

## The wrong-key case

The sixth assertion reads oddly in the output. Under a wrong API key, every provider returned the caller's default rather than the real flag value. That is the right behaviour: none failed open, and none leaked a value from a server that had rejected the request.

## Three mistakes that were mine

Nothing surprising happened after Go. The three problems along the way were all in my test code, not the product, but a reader writing a language guide will hit the same three:

- In Ruby, the `Configuration` class sits at `OpenFeature::OFREP`, not under `Provider`.
- In Java, the options builder is reached through `OfrepProviderOptions.builder()`, because its constructor is package private.
- In Rust, the crate needs `open-feature` 0.3 and `reqwest` 0.13, not the older majors.

## Where that leaves the claim

Seven languages pass against a live server: JavaScript, Go, Python, Ruby, Java, Rust and .NET, tested on 23 August 2026 at the provider versions above. The landing page now claims what I measured, and the procedure is written down so anyone can re-run it when a provider changes.
