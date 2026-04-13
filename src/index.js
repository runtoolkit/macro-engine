/**
 * macro-engine — JS runtime engine
 * Barrel export: import everything from one place.
 */

export { TickLoop }     from './tick.js';
export { EventBus }     from './event.js';
export { HookSystem, HOOKS } from './hook.js';
export { Cooldown }     from './cooldown.js';
export { Scheduler }    from './scheduler.js';
export { Queue }        from './queue.js';
export { FiberManager } from './fiber.js';
export { Batch }        from './batch.js';
export { State }        from './state.js';
export { Config }       from './config.js';
export { RateLimit }    from './rate-limit.js';
export { Logger, LogLevel } from './log.js';

export * as math   from './math.js';
export * as str    from './string.js';

/**
 * Engine — convenience class that wires all subsystems together.
 *
 * Usage:
 *   const engine = new Engine();
 *   engine.tick.register('main', (t) => { ... });
 *   engine.start();
 */
import { TickLoop }     from './tick.js';
import { EventBus }     from './event.js';
import { HookSystem }   from './hook.js';
import { Cooldown }     from './cooldown.js';
import { Scheduler }    from './scheduler.js';
import { Queue }        from './queue.js';
import { FiberManager } from './fiber.js';
import { Batch }        from './batch.js';
import { State }        from './state.js';
import { Config }       from './config.js';
import { RateLimit }    from './rate-limit.js';
import { Logger }       from './log.js';

export class Engine {
  constructor({ msPerTick = 50, debug = false } = {}) {
    this.tick      = new TickLoop(msPerTick);
    this.events    = new EventBus();
    this.hooks     = new HookSystem();
    this.cooldown  = new Cooldown();
    this.scheduler = new Scheduler();
    this.queue     = new Queue();
    this.fibers    = new FiberManager();
    this.batch     = new Batch();
    this.state     = new State();
    this.config    = new Config();
    this.rateLimit = new RateLimit();
    this.log       = new Logger({ minLevel: debug ? 0 : 1 });

    if (debug) {
      this.events.setDebug(true);
      this.hooks.setDebug(true);
      this.log.setDebug(true);
    }

    // Wire queue flush into tick pipeline
    this.tick.register('_queue', () => this.queue.flush());
    // Wire deferred event flush into tick pipeline
    this.tick.register('_events', () => this.events.flushQueue());
  }

  start() { this.tick.start(); }
  stop()  { this.tick.stop();  }
}
