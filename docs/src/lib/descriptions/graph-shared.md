All graph endpoints operate over Obsidian's pre-indexed link graph (`metadataCache.resolvedLinks`). Each returned note carries `inboundCount`, `outboundCount`, `tags`, and two short excerpts:

- `frontmatterExcerpt` — up to ~100 characters of the YAML frontmatter body (whitespace-collapsed; empty if the file has no frontmatter).
- `contentExcerpt` — up to ~100 characters of the markdown body following any frontmatter (whitespace-collapsed).

The two excerpts are returned separately because frontmatter is identity-bearing for some notes (Atlas hubs, structured data) and noise for others.

### `excludeResults` vs `excludeFromGraph`

Both parameters take an array of glob patterns. Their semantics are intentionally distinct:

- **`excludeResults`** — paths matching these patterns are not returned in the result list, but they remain part of the graph. Their outbound links still contribute to other notes' `inboundCount`. Use this to hide notes from suggestions while still acknowledging that being linked from them counts.
- **`excludeFromGraph`** — paths matching these patterns are treated as if they did not exist. They cannot appear in results, and they do not contribute to any other note's `inboundCount` or `outboundCount`. Use this to remove noise sources (e.g. `["02 Journal/**"]` to ignore journal-only links when scoring orphan candidates).
