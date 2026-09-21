---
title: dsl-query-builder
summary: A zero-dependency TypeScript query builder for OpenSearch and Elasticsearch DSL.
kind: open-source
role: Author
start: '2025-02'
featured: true
weight: 3
caseStudy: true
stack: [TypeScript]
metrics:
  - { label: Size, value: 'Under 15 KB' }
  - { label: Dependencies, value: '0' }
  - { label: Licence, value: MIT }
links:
  - { label: npm, href: 'https://www.npmjs.com/package/dsl-query-builder' }
  - { label: Source, href: 'https://github.com/TheOluwafemi/dsl-query-builder' }
---

## What it is

A small library for building OpenSearch and Elasticsearch queries in TypeScript. You chain calls, and `build()` returns the JSON body:

```ts
import { createQuery } from 'dsl-query-builder'

const dsl = createQuery()
  .match('title', 'javascript tutorial')
  .range('publishedAt', { gte: '2023-01-01' })
  .sort('_score', 'desc')
  .size(10)
  .build()
```

It covers text search, exact matches, ranges, patterns, boolean logic, nested queries and geo search, with generic types for type-safe queries.

## The decision worth writing down

An earlier version shipped with an HTTP client, axios, and weighed about 65 KB. The current one is under 15 KB with no dependencies, because a query builder's job is to produce a JSON body. Sending it is the application's business.

Taking the client out made the library do one thing, and it works with whatever the app already uses: `fetch`, axios, ky. It also removed a dependency that every consumer would otherwise inherit and have to keep patched.
