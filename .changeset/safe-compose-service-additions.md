---
"ayanokoji": patch
---

Preserve existing Compose configuration when `docker init` adds services, reject colliding service batches, and create missing generated volume declarations without overwriting existing ones. Closes #17
