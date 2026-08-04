---
"ayanokoji": minor
---

Make `docker remove` validate complete service batches, protect explicit `depends_on` relationships, and conservatively clean only generated Compose volumes. Closes #18
