# Authoring YARP Docs content

This directory is the source of truth for every doc page's actual content.
Nothing under `public/assets/mock-api/v1/pages/**` is ever hand-edited — it's
compiled from the Markdown files here by `scripts/content/build-content.mjs`
and should be treated the same way you'd treat a `dist/` folder.

```
content/
  README.md          this file
  _glossary.md        do-not-translate terms + per-locale term table
  en/                 English is the source language - every slug's
                       content/en/<slug>.md must exist before that slug's
                       nav/search-index entries can be regenerated
  bg/ de/ el/ es/     one file per translated slug. A locale simply
  fr/ pt-BR/ ru/      doesn't have a file for a slug it hasn't translated
  zh-Hans/            yet - the compiler serves the English version for
                       that (locale, slug) with translated: false, so every
                       page always resolves to something.
```

## Where the content comes from

Every page is adapted from Microsoft's own YARP documentation on
[Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/),
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The
original pages were extracted to plain text PDFs (kept at the repository
root, one per topic) specifically so authoring and technical accuracy could
be checked against Microsoft's actual wording without needing network
access. See `/NOTICE` at the repository root for the full attribution
statement this project publishes under.

**Hard rule: no API name, type, method, config key, default value, or
version claim may appear in a page unless it's grounded in that page's
source PDF text** (or another PDF in the same corpus, for genuinely
cross-cutting concepts). "Expanded" content means added conceptual framing
— an intro, a when-to-use note, a worked example built only from APIs the
source actually shows — never invented surface area. If a comparison table
needs a value you can't find in the source, the cell is `—`, not a guess.

To re-extract a source PDF's plain text as a grounding reference while
writing or reviewing a page:

```sh
node scripts/content/extract-pdf.mjs <slug>
```

This prints to stdout and writes nothing — read it in one pane while
writing the `.md` file in another. `PDF_FILENAMES` in that script is the
slug → PDF filename mapping.

## Frontmatter

```yaml
---
slug: load-balancing # must match the filename (load-balancing.md)
title: Load balancing
lede: >-
  When a cluster has more than one healthy destination, YARP picks which one handles each
  request using a configurable load balancing policy.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
seeAlso: [session-affinity, dests-health-checks] # optional
keywords: [PowerOfTwoChoices, LoadBalancingPolicy] # optional, for search
---
```

- **slug** — must match the filename and must be one of `ia.mjs`'s
  `ALL_ITEMS` (that file, not frontmatter, is what actually decides a
  page's group/kind/prev-next order — a slug can't invent a new page just
  by having a file here).
- **title**, **lede** — plain text, no Markdown. `lede` is the one- or
  two-sentence summary shown under the `<h1>` and used as the page's
  search-index excerpt and meta description.
- **sourceUrl** — optional; falls back to `SOURCE_URL_BASE + slug` from
  `ia.mjs` if omitted. Set it explicitly when a slug's URL doesn't follow
  that pattern (see `SOURCE_URL_SLUG_OVERRIDES` in `ia.mjs`).
- **lastUpdated** — authored, an ISO date (`2025-01-15`), never generated at
  build time. This is what makes re-running the compiler idempotent and
  `git status`/`git diff` a meaningful signal of what actually changed.
- **seeAlso** — optional array of other slugs. Appends a translated "See
  also" section linking to each target's own title in the current locale.
- **keywords** — optional array of extra search terms (e.g. exact API
  names) beyond what's automatically picked up from inline `` `code` ``
  spans in the body.

A **translated** file (anything outside `content/en/`) uses the exact same
frontmatter shape, translated, with two differences: `title`/`lede` are
translated prose, and `sourceUrl` almost always stays the English Microsoft
Learn URL (there usually isn't a translated version of the source page to
point to instead).

## Body syntax

Standard GFM (headings, lists, tables, links, fenced code, bold/italic)
plus:

**Explicit heading ids — English files only.**

```markdown
## Policies {#policies}
```

Only `##`/`###` headings take an id, and only in `content/en/<slug>.md`.
**Translated files must not use `{#id}` at all** — the compiler transplants
the English ids onto the translated headings by position, matching each
translated `##`/`###` to the English heading in the same position. This is
what keeps `#anchor` links, the table of contents, and search results
working identically across a locale switch. It also means a translated
file's headings must appear in the *same order and at the same levels* as
the English source — dropping, reordering, or promoting/demoting a heading
fails the build with a clear error naming the slug and the mismatch.

**Callouts:**

```markdown
:::note
Prose here. Can span multiple paragraphs.
:::

:::important
...
:::

:::tip
...
:::
```

The bold label ("Note" / "Important" / "Tip") is never authored in the
Markdown — it's rendered from the target locale's own
`docBody.calloutNote`/`calloutImportant`/`calloutTip` string in
`public/assets/i18n/<locale>.json`, so it's always correctly localized even
on an untranslated page.

**Example boxes**, wrapping one or more fenced code blocks:

```markdown
:::example Set a cluster's policy
The `LoadBalancingPolicy` field on a cluster.

​```json
{ "Clusters": { "cluster1": { "LoadBalancingPolicy": "PowerOfTwoChoices" } } }
​```
:::
```

A fenced code block *outside* an `:::example` still renders, just without
the title/description card around it (a plain bordered block).

Supported fence languages (anything else renders unhighlighted, tagged with
its literal fence-info string): `csharp`, `json`, `xml`, `dotnetcli`,
`bash`, `powershell`, `yaml`, plus `output`/`console` for showing program
output (no syntax highlighting, tagged "Output"/"Console" — translated —
instead of a language name).

**Cross-links**, via a `doc:` pseudo-scheme so the compiler owns locale
prefixing and dead-link detection:

```markdown
See [Destination health checks](doc:dests-health-checks) for details.
See [the policies section](doc:load-balancing#policies) on the same page.
```

A `doc:` link to a slug that isn't in `ia.mjs`'s `ALL_ITEMS` fails the
build immediately (`UnknownDocLinkError`), naming both the bad slug and the
file it was found in — there is no such thing as a silently dead `doc:`
link. A regular Markdown link (`[text](https://...)`) to an external URL
still works normally and opens in a new tab automatically.

**Code is never translated.** Fenced code block content and language tag
are always taken from the English source by construction — this is not a
translator convention, it's structural: a translated file's own fence
content is discarded and the English bytes are used instead. Write
translated prose around the example; don't try to translate the JSON/C#/
etc. inside it.

## Building and checking

```sh
npm run content:build              # compile every slug that has an English source
npm run content:build -- --slug=load-balancing     # just one slug, all locales
npm run content:build -- --locale=de               # just one locale, all slugs it has files for
npm run content:check              # validate the compiled output tree
```

`content:build` is resumable by construction: it only compiles slugs that
have a `content/en/<slug>.md`, so authoring can land in batches without ever
leaving the fixture tree half-written. `nav/<locale>.json` and
`search-index/<locale>.json` only regenerate on a full, unfiltered run, and
only once every one of the 36 English sources exists — regenerating them
from a partial title index would silently drop slugs the previous fixtures
had correct data for.

`content:check` (also run from a Vitest spec, so a hand-edited JSON file
can't bypass it) catches: a page missing required DTO keys, duplicate or
orphaned heading ids, a `translated: true` page whose prose is actually
byte-identical to English (or the inverse — `translated: false` with prose
that differs, meaning a stale flag), code that differs from English across
locales, and a `prev`/`next` or nav title that doesn't match its target's
own title.

Both `npm run lint` and `npm test` must pass before any content change is
committed, same as any other change in this repository — `npm test` runs
`scripts/**/*.spec.mjs` (which includes this compiler's own tests)
alongside the Angular app's tests.

## Translating a page

1. Copy `content/en/<slug>.md` to `content/<locale>/<slug>.md`.
2. Translate `title`, `lede`, and the body prose. Leave `sourceUrl` as-is
   unless a genuinely translated Microsoft Learn page exists.
3. Remove every `{#id}` from headings — translated files don't carry them.
4. Check `_glossary.md` for this locale's agreed term for any recurring
   technical word before inventing your own — consistency across the 36
   pages matters more than any single page reading slightly more natural.
5. Leave every fenced code block's content and language tag exactly as
   written in English — the compiler ignores it either way, but keeping it
   identical makes the diff reviewable.
6. Run `npm run content:build -- --locale=<locale>` then
   `npm run content:check` and fix anything it flags before committing.
