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
