/**
 * Log — structured logger with levels.
 */

export const LogLevel = Object.freeze({
  DEBUG: 0,
  INFO:  1,
  WARN:  2,
  ERROR: 3,
});

export class Logger {
  #entries  = [];
  #maxSize  = 256;
  #minLevel = LogLevel.INFO;
  #sink;

  constructor({ maxSize = 256, minLevel = LogLevel.INFO, sink = null } = {}) {
    this.#maxSize = maxSize;
    this.#minLevel = minLevel;
    this.#sink = sink ?? ((e) => {
      const prefix = `[${e.level}]`;
      if (e.levelCode === LogLevel.ERROR) console.error(prefix, e.msg);
      else if (e.levelCode === LogLevel.WARN) console.warn(prefix, e.msg);
      else if (e.levelCode === LogLevel.DEBUG) console.debug(prefix, e.msg);
      else console.log(prefix, e.msg);
    });
  }

  setDebug(on) { this.#minLevel = on ? LogLevel.DEBUG : LogLevel.INFO; }
  setMinLevel(lvl) { this.#minLevel = lvl; }

  debug(msg, ...extra) { this.#log('DEBUG', LogLevel.DEBUG, msg, extra); }
  info(msg, ...extra) { this.#log('INFO', LogLevel.INFO, msg, extra); }
  warn(msg, ...extra) { this.#log('WARN', LogLevel.WARN, msg, extra); }
  error(msg, ...extra) { this.#log('ERROR', LogLevel.ERROR, msg, extra); }

  add(level, msg) {
    this.#log(String(level).toUpperCase(), LogLevel.INFO, msg, []);
  }

  show(count = 20) { return this.#entries.slice(-count); }
  clear() { this.#entries.length = 0; }

  #log(levelLabel, levelCode, msg, extra) {
    if (levelCode < this.#minLevel) return;
    const entry = {
      level: levelLabel,
      levelCode,
      msg: extra.length ? `${msg} ${extra.map(String).join(' ')}` : String(msg),
      timestamp: Date.now(),
    };
    this.#entries.push(entry);
    if (this.#entries.length > this.#maxSize) this.#entries.shift();
    try { this.#sink(entry); } catch (_) {}
  }
}
