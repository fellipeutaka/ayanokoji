# Ayanokoji

Ayanokoji is a CLI for scaffolding and configuring modern web development tools and utilities.

## Language

### Docker Compose

**Compose document**:
The complete Docker Compose configuration Ayanokoji edits when initializing or removing services. It includes selected services, shared resources, and unrelated user-owned entries that must remain intact; Ayanokoji changes only the entries within the requested operation and treats the rest as opaque.
_Avoid_: Compose file, when referring to the configuration rather than its on-disk representation

**Generated Compose volume**:
A local named volume declaration created as part of Ayanokoji's Docker setup. It is removable only when no remaining service references it and its declaration is not external or user-configured.
_Avoid_: orphaned volume, when ownership is uncertain

**Compose dependency**:
A relationship in a Compose configuration where one service requires another named service to remain present for the configuration to stay valid. Removing the depended-on service is rejected when a known dependency would be left dangling.
_Avoid_: dangling reference, when describing the domain relationship
