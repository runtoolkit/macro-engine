# macro-engine

A modular JavaScript runtime engine with tick pipelines, events, hooks, fibers, scheduling, rate limiting, and secure command execution.

## Highlights

- Safe command execution without `eval`
- Single and multi-command runners
- Script splitting for `;` and newline separated command chains
- Optional permissions and timeouts per command
- Prototype-pollution resistant context cloning
- Concurrency-aware parallel execution

## Quick start

```js
import { Engine } from 'macro-engine';

const engine = new Engine();

engine.commands.register('echo', ({ args }) => args.join(' '));

await engine.commands.run('echo hello world');
await engine.commands.runScript(`
  echo first;
  echo second
`);
```

## Security notes

- No shell execution
- No string-to-code evaluation
- Dangerous object keys are filtered during cloning
- Cyclic objects are handled safely during cloning

## Versioning

Current version: `1.0.5`
