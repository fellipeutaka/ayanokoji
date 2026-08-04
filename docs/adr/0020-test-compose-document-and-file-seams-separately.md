# Test Compose document and file seams separately

**Status**: accepted

The Compose document module is tested through in-memory documents, while the file adapter is tested against temporary filesystem fixtures. Command modules receive only thin integration coverage for prompt and error wiring, keeping the main behavior tests independent of interactive prompts and terminal output.
