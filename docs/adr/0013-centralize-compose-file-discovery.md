# Centralize Compose file discovery

**Status**: accepted

The Compose file adapter owns recognition and reading of supported Compose filenames so initialization and removal share one discovery rule. Command modules may prompt when multiple candidates exist, but discovery itself remains independent of prompts.
