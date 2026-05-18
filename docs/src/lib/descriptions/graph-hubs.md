Return the top notes by inbound link count — useful for finding the de facto hubs of the vault (notes that lots of other notes link to). This often surfaces concepts that have grown into hubs without ever being formally declared as such.

Results are sorted by `inboundCount` descending, then by `path` ascending for stability across identical counts. Notes with zero inbound links are never returned regardless of `maxResults`.
