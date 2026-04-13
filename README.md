# macro-engine

A modular, general-purpose JavaScript runtime engine for safe command execution, scheduling, event dispatch, hooks, ticks, state, rate limiting, and utility workflows.

## Features

- Safe command registration and execution
- Single-command and multi-command runners
- Script parsing for `;` and new lines
- Event bus and hook system
- Scheduler, queue, cooldown, and rate limiting
- Fiber-style cooperative coroutines
- Browser-friendly ESM modules
- Security-first design: no `eval`, no shell execution

## Install

```bash
npm install macro-engine
```

## Usage

```js
import { Engine } from 'macro-engine';

const engine = new Engine({ debug: true });

engine.commands.register('echo', async ({ args }) => {
  return args.join(' ');
});

const result = await engine.commands.run('echo Hello world');
console.log(result.value);
```

## Multi-command scripts

```js
import { CommandSystem } from 'macro-engine';

const commands = new CommandSystem();

commands.register('say', async ({ args }) => args.join(' '));

await commands.runScript(`
say Hello;
say World
`);
```

## Permissions

Commands can declare required permissions:

```js
commands.register('admin-only', async () => 'ok', {
  requires: ['admin']
});

await commands.run('admin-only', {
  permissions: ['admin']
});
```

## Timeouts

You can set a timeout per run:

```js
await commands.run('slow-task', { timeoutMs: 1000 });
```

## Security

This package is designed to remain platform-independent and safe by default:

- inputs are validated
- command strings are parsed, not evaluated
- no raw code execution
- no shell access

## Exports

Each module can be imported individually:

```js
import { Scheduler } from 'macro-engine/scheduler';
import { splitCommandScript } from 'macro-engine/script';
```
