Find notes with few inbound and/or outbound links — useful for surfacing link candidates and underused notes when building out a vault's graph.

By default, returns strict orphans (notes with zero inbound links AND zero outbound links). Raise `minInbound` / `minOutbound` to find near-orphans:

- `minInbound: 0, minOutbound: 2` → notes with outgoing links that nothing links back to.
- `minInbound: 2, minOutbound: 0` → notes that are linked from elsewhere but link nowhere.

The thresholds are **inclusive maxima**: a note is returned only if `inboundCount <= minInbound` AND `outboundCount <= minOutbound`. Raising a threshold makes the filter looser.
