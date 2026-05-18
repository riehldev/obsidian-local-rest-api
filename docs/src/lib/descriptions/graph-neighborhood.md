Return notes within N hops of a given center note in the link graph — useful for finding notes thematically near a starting point so you can decide what to link.

Results are ordered by hop distance ascending, then by traversal order. The center note itself is not returned. Each result carries a `distance` field (1..hops) indicating how many hops from the center it sits at.

When `includeBacklinks` is `true` (default), the graph is traversed as **undirected** — both outgoing links and backlinks count as edges. When `false`, only outgoing links are followed. For "what could I link to from here," undirected is usually correct, since being linked from another note is equally strong signal that two notes belong near each other.
