import test from 'node:test';
import assert from 'node:assert/strict';

import { CommandSystem } from '../src/command.js';
import { splitScript } from '../src/script.js';
import * as math from '../src/math.js';
import * as str from '../src/string.js';

 test('command contexts do not allow prototype pollution', async () => {
  const engine = new CommandSystem();
  let seen;
  engine.register('inspect', ({ args, command }) => {
    seen = { args, command };
    return 'ok';
  });

  const payload = JSON.parse('{"name":"inspect","args":[{"__proto__":{"polluted":true},"safe":1}]}');
  const result = await engine.run(payload);

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(seen.args[0].safe, 1);
  assert.equal(seen.args[0].polluted, undefined);
});

test('queued contexts are cloned before enqueue', async () => {
  const engine = new CommandSystem();
  let observed;
  engine.register('read', ({ value }) => {
    observed = value;
    return value;
  });

  const ctx = { value: 1 };
  engine.enqueue('read', ctx);
  ctx.value = 99;

  const summary = await engine.flush();
  assert.equal(summary.ok, true);
  assert.equal(observed, 1);
});

test('script splitter handles quoted semicolons and comments', () => {
  assert.deepEqual(splitScript('say "a;b"; # note\nrun next'), ['say "a;b"', 'run next']);
});

test('math helpers validate unsafe inputs', () => {
  assert.throws(() => math.mapRange(5, 1, 1, 0, 10), RangeError);
  assert.throws(() => math.mod(1, 0), RangeError);
  assert.equal(math.random(3, 3), 3);
});

test('string helpers validate unsafe inputs', () => {
  assert.throws(() => str.repeat('x', -1), RangeError);
  assert.throws(() => str.progressBar(1, 0), RangeError);
  assert.equal(str.repeat(2, 3), '222');
});
