# macro-engine

A modular JS runtime engine for safe, extensible command execution and general-purpose automation.

## Features

- Tick loop and scheduling
- Event bus and hooks
- Queue and batch helpers
- Safe command registry
- Single and multi-command execution
- Script parsing
- Middleware pipeline
- Rate limiting and structured logging

## Usage

```js
import { CommandSystem } from 'macro-engine';

const engine = new CommandSystem({ timeoutMs: 1000 });

engine.register('say', ({ args }) => {
  console.log(args.join(' '));
});

await engine.runScript('say Hello; say World');
```
