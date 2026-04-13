# macro-engine

A modular JavaScript runtime engine. Provides a tick pipeline, event bus, lifecycle hooks, coroutine fibers, scheduling, rate limiting, and utility libraries.

Ported from the [macroEngine-datapack](https://github.com/tickwarden/macroEngine-datapack) architecture.

---

## Installation

```bash
# copy src/ into your project, or reference index.js directly
import { Engine } from './src/index.js';
```

---

## Quick start

```js
import { Engine } from './src/index.js';

const engine = new Engine({ debug: true });

// Register a tick channel — fires every 20 ticks (1s at 20 TPS)
engine.tick.register('heartbeat', (tick) => {
  console.log('tick:', tick);
}, { rate: 20 });

// Register an event handler
engine.events.register('player_join', ({ name }) => {
  console.log(`${name} joined`);
});

// Fire the event
engine.events.fire('player_join', { name: 'Alice' });

engine.start();
```

---

## Modules

| Module | Class / exports | Original |
|--------|----------------|----------|
| `tick.js` | `TickLoop` | `macro:tick/*` |
| `event.js` | `EventBus` | `macro:event/*` |
| `hook.js` | `HookSystem`, `HOOKS` | `macro:hook/*` |
| `cooldown.js` | `Cooldown` | `macro:cooldown/*` |
| `scheduler.js` | `Scheduler` | `macro:lib/schedule`, `repeat`, `wait`, `debounce`, `throttle`, `once` |
| `queue.js` | `Queue` | `macro:queue/*` |
| `fiber.js` | `FiberManager` | `macro:lib/fiber/*` |
| `batch.js` | `Batch` | `macro:lib/batch/*` |
| `state.js` | `State` | `macro:state/*`, `macro:flag/*`, player vars |
| `config.js` | `Config` | `macro:config/*` |
| `rate-limit.js` | `RateLimit` | `macro:rate_limit/*` |
| `log.js` | `Logger`, `LogLevel` | `macro:log/*` |
| `math.js` | named exports | `macro:math/*` |
| `string.js` | named exports | `macro:lib/string/*`, `macro:string/*` |
| `index.js` | `Engine` + re-exports | all |

---

## TickLoop

```js
import { TickLoop } from './src/tick.js';

const loop = new TickLoop(50); // 50ms = 20 TPS

loop.register('myChannel', (tick) => {
  // runs every tick
});

loop.register('slow', (tick) => {
  // runs every 5 ticks
}, { rate: 5, offset: 2 });

loop.register('conditional', (tick) => {
  // runs only when condition is true
}, { condition: () => someFlag });

loop.start();
loop.pause();
loop.resume();
loop.stop();

loop.list(); // → [{ name, rate, offset, enabled }]
```

---

## EventBus

```js
import { EventBus } from './src/event.js';

const bus = new EventBus();

const off = bus.register('my_event', (ctx) => {
  console.log('fired:', ctx);
});

bus.register('once_event', (ctx) => {
  console.log('fires only once');
}, { once: true });

bus.fire('my_event', { value: 42 });
bus.fireQueued('my_event', { value: 99 }); // deferred
bus.flushQueue();

off(); // unregister
```

---

## HookSystem

```js
import { HookSystem, HOOKS } from './src/hook.js';

const hooks = new HookSystem();

hooks.bind('on_player_join', 'my_plugin', (ctx) => {
  console.log('joined:', ctx.name);
});

// Host calls dispatch when the event happens:
hooks.dispatch('on_player_join', { name: 'Alice' });

hooks.unbind('my_plugin');
```

---

## Cooldown

```js
import { Cooldown } from './src/cooldown.js';

const cd = new Cooldown();

cd.set('alice', 'ability', 3000);  // 3 second cooldown

if (cd.isReady('alice', 'ability')) {
  cd.set('alice', 'ability', 3000);
  // use ability
}

cd.remaining('alice', 'ability');   // ms left
cd.pause('alice', 'ability');
cd.resume('alice', 'ability');
cd.extend('alice', 'ability', 1000);
cd.clear('alice', 'ability');
```

---

## Scheduler

```js
import { Scheduler } from './src/scheduler.js';

const s = new Scheduler();

s.schedule('welcome', () => console.log('hi'), 1000);          // once after 1s
s.schedule('heartbeat', () => console.log('beat'), 0, 2000);   // every 2s
s.cancel('heartbeat');

s.repeat((i) => console.log('step', i), 5, 500);  // 5 times, 500ms apart

await s.wait(1000);   // Promise — works in async functions

const throttled = s.throttle(fn, 100);
const debounced = s.debounce(fn, 300);

s.once('init', () => console.log('only once'));
```

---

## Fibers

```js
import { FiberManager } from './src/fiber.js';

const fibers = new FiberManager();

async function* countdown(fiber) {
  for (let i = 3; i >= 0; i--) {
    console.log(i);
    await fiber.wait(1000);   // auto-resume after 1s
  }
}

async function* interactive(fiber) {
  console.log('waiting for resume...');
  await fiber.yield();        // suspended until fibers.resume('id') is called
  console.log('resumed!');
}

fibers.spawn('countdown', countdown);
fibers.spawn('interactive', interactive);

// Later, from elsewhere:
fibers.resume('interactive');
fibers.kill('countdown');
fibers.isAlive('countdown'); // false
```

---

## RateLimit

```js
import { RateLimit } from './src/rate-limit.js';

const rl = new RateLimit();

// Max 5 hits per second for a global event
rl.config('global:my_event', 5, 1000);

// Per-player template (key is auto-expanded)
rl.config('player:shop', 3, 60_000); // 3 purchases per minute per player

if (rl.check('global:my_event')) {
  // allowed
}

// Per-entity: uses the "player:shop" template automatically
if (rl.check('player:shop:alice')) {
  // allowed for alice
}
```

---

## Math

```js
import * as math from './src/math.js';

math.clamp(15, 0, 10);         // 10
math.lerp(0, 100, 0.25);       // 25
math.distance2d(0, 0, 3, 4);  // 5
math.random(1, 6);             // d6
math.weightedRandom([
  { value: 'common', weight: 70 },
  { value: 'rare',   weight: 25 },
  { value: 'epic',   weight: 5  },
]);
math.vec.dot([1,0,0], [0,1,0]); // 0
```

---

## String

```js
import * as str from './src/string.js';

str.progressBar(7, 10, 20);         // "██████████████░░░░░░"
str.formatTicks(1200);              // "1m 0s"
str.ordinal(3);                     // "3rd"
str.pluralize(5, 'item');           // "5 items"
str.formatNumber(1234567);          // "1,234,567"
str.replace('hello world', 'world', 'JS'); // "hello JS"
```

---

## License

MIT
