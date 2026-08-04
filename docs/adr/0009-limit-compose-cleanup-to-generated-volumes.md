# Limit Compose cleanup to generated volumes

**Status**: accepted

Docker service removal cleans only generated local named volume declarations that satisfy the conservative ownership rule. Networks, configs, secrets, and other Compose resources remain untouched, even when they appear unused, because their ownership or usage may be hidden from the document module.
