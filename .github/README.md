# macro-engine

![Auto Assign](https://github.com/runtoolkit/macro-engine/actions/workflows/auto-assign.yml/badge.svg)

A modular JavaScript runtime engine. Provides a tick pipeline, event bus, lifecycle hooks, coroutine fibers, scheduling, rate limiting, and utility libraries.

Works in both **Node.js** and **browser** environments.

---

## Installation

```bash
npm install macro-engine
```

Or copy `src/` directly into your project:

```js
import { Engine } from './src/index.js';
```

---

## Quick start

```js
import { Engine } from 'macro-engine';

const engine = new Engine({ debug: true });

// Register a tick channel — fires every 20 ticks
engine.tick.register('heartbeat', (tick) => {
  console.log('tick:', tick);
}, { rate: 20 });

// Register an event handler
engine.events.register('user_join', ({ name }) => {
  console.log(`${name} joined`);
});

engine.events.fire('user_join', { name: 'Alice' });

engine.start();
```

---

## Browser (script tag)

```html
<script src="dist/macro-engine.umd.js"></script>
<script>
  const { Engine } = MacroEngine;
  const engine = new Engine();
  engine.start();
</script>
```

---

## Modules

| Module | Class / Exports |
|--------|----------------|
| `tick.js` | `TickLoop` |
| `event.js` | `EventBus` |
| `hook.js` | `HookSystem`, `HOOKS` |
| `cooldown.js` | `Cooldown` |
| `scheduler.js` | `Scheduler` |
| `queue.js` | `Queue` |
| `fiber.js` | `FiberManager` |
| `batch.js` | `Batch` |
| `state.js` | `State` |
| `flag.js` | `FlagStore`, `Flag` |
| `config.js` | `Config` |
| `rate-limit.js` | `RateLimit` |
| `command.js` | `CommandSystem`, `CommandRegistry` |
| `log.js` | `Logger`, `LogLevel` |
| `math.js` | named exports |
| `string.js` | named exports |
| `index.js` | `Engine` + re-exports |

---

## TickLoop

```js
import { TickLoop } from 'macro-engine/tick';

const loop = new TickLoop(50); // 50ms per tick

loop.register('myChannel', (tick) => { });

loop.register('slow', (tick) => { }, { rate: 5, offset: 2 });

loop.register('conditional', (tick) => { }, { condition: () => someFlag });

loop.start();
loop.pause();
loop.resume();
loop.stop();
```

### Worker thread (offload to background thread)

```js
const { loop, worker } = TickLoop.fromWorker(50);
loop.register('bg', (tick) => { });
loop.start();
```

---

## EventBus

```js
import { EventBus } from 'macro-engine/event';

const bus = new EventBus();

const off = bus.register('my_event', (ctx) => { console.log(ctx); });

bus.register('once_event', (ctx) => { }, { once: true });

bus.fire('my_event', { value: 42 });
bus.fireQueued('my_event', { value: 99 });
bus.flushQueue();

off();
```

---

## HookSystem

```js
import { HookSystem } from 'macro-engine/hook';

const hooks = new HookSystem();

hooks.bind('on_user_join', 'my_plugin', (ctx) => {
  console.log('joined:', ctx.name);
});

hooks.dispatch('on_user_join', { name: 'Alice' });

hooks.unbind('my_plugin');
```

---

## Cooldown

```js
import { Cooldown } from 'macro-engine/cooldown';

const cd = new Cooldown();

cd.set('alice', 'ability', 3000);

if (cd.isReady('alice', 'ability')) {
  cd.set('alice', 'ability', 3000);
}

cd.remaining('alice', 'ability');
cd.pause('alice', 'ability');
cd.resume('alice', 'ability');
cd.extend('alice', 'ability', 1000);
```

---

## Scheduler

```js
import { Scheduler } from 'macro-engine/scheduler';

const s = new Scheduler();

s.schedule('hello', () => console.log('hi'), 1000);
s.schedule('heartbeat', () => console.log('beat'), 0, 2000);
s.cancel('heartbeat');

s.repeat((i) => console.log('step', i), 5, 500);

await s.wait(1000);

const throttled = s.throttle(fn, 100);
const debounced = s.debounce(fn, 300);

s.once('init', () => console.log('only once'));
```

---

## Queue

```js
import { Queue } from 'macro-engine/queue';

const q = new Queue({ rate: 1 });

q.push(fn);
q.flush();
q.flushAll();

// Adaptive drain — scales rate automatically under load
q.setAdaptiveRate(1, 20);
```

---

## Fibers

```js
import { FiberManager } from 'macro-engine/fiber';

const fibers = new FiberManager();

async function* countdown(fiber) {
  for (let i = 3; i >= 0; i--) {
    console.log(i);
    await fiber.wait(1000);
    if (!fiber.alive) break;
  }
}

fibers.spawn('countdown', countdown);
fibers.kill('countdown');
```

---

## RateLimit

```js
import { RateLimit } from 'macro-engine/rate-limit';

const rl = new RateLimit();

rl.config('global:action', 5, 1000);
rl.config('user:purchase', 3, 60_000);

if (rl.check('global:action')) { }
if (rl.check('user:purchase:alice')) { }
```

---

## Math

```js
import * as math from 'macro-engine/math';

math.clamp(15, 0, 10);
math.lerp(0, 100, 0.25);
math.distance2d(0, 0, 3, 4);
math.random(1, 6);
math.weightedRandom([
  { value: 'common', weight: 70 },
  { value: 'rare',   weight: 25 },
  { value: 'epic',   weight: 5  },
]);
math.vec.dot([1,0,0], [0,1,0]);
```

---

## CommandSystem

```js
import { CommandSystem } from 'macro-engine/command';

const commands = new CommandSystem();

commands.register('echo', ({ args }) => args.join(' '));
commands.register('add', ({ args }) => args.map(Number).reduce((a, b) => a + b, 0));

await commands.run('echo hello world');
await commands.runMany(['echo first', 'echo second'], {}, { mode: 'series' });
```

---

## License

MIT
