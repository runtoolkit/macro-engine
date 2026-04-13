/**
 * tick-worker.js — Worker thread that drives TickLoop on a separate thread.
 *
 * Usage: TickLoop.fromWorker(msPerTick)
 *
 * Messages in:
 *   { type: 'start', msPerTick: number }
 *   { type: 'stop' }
 *
 * Messages out:
 *   { type: 'tick' }  — posted every msPerTick ms
 */

let intervalId = null;

self.onmessage = (e) => {
  const { type, msPerTick } = e.data;

  if (type === 'start') {
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, msPerTick);
    return;
  }

  if (type === 'stop') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
