# Changelog

## 1.0.5

### Added
- `script.js` for safe multi-command script splitting
- `CommandSystem.runScript()`
- `Engine.script` helper
- command permissions and timeouts
- parallel runner concurrency control

### Fixed
- prototype pollution risk in cloned command context
- cyclic object cloning in command payloads
- unused concurrency option in parallel execution
- safer queue flush summaries
=======
## 1.0.6

### Security
- Hardened command input cloning to skip accessor properties and dangerous keys.
- Queued command contexts are cloned before storage to avoid mutation leaks.

### Bug fixes
- Added validation to math helpers to prevent divide-by-zero and invalid range bugs.
- Added validation to string helpers to avoid runtime errors on invalid input.
- Added `Batch.flushAsync()` for async batch handlers.
- Added iterable validation to `Queue.pushMany()`.
- Updated test script to use Node's built-in test runner.
