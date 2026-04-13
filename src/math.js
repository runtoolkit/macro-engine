/**
 * Math utilities.
 */

export const abs   = (x) => Math.abs(x);
export const sign  = (x) => Math.sign(x);
export const signNonzero = (x) => (x >= 0 ? 1 : -1);
export const min   = (a, b) => Math.min(a, b);
export const max   = (a, b) => Math.max(a, b);
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const minmax = (a, b) => (a <= b ? { min: a, max: b } : { min: b, max: a });
export const mod   = (x, m) => ((x % m) + m) % m;
export const wrap  = (x, lo, hi) => lo + mod(x - lo, hi - lo);
export const ceilDiv = (a, b) => Math.ceil(a / b);
export const divmod = (a, b) => ({ quot: Math.trunc(a / b), rem: a % b });
export const mulDiv = (a, b, c) => (a * b) / c;
export const round = (x) => Math.round(x);
export const sqrt  = (x) => Math.sqrt(x);
export const pow   = (base, exp) => Math.pow(base, exp);
export const log2  = (x) => Math.log2(x);

export const sin   = (deg) => Math.sin((deg * Math.PI) / 180);
export const cos   = (deg) => Math.cos((deg * Math.PI) / 180);
export const atan2 = (y, x) => (Math.atan2(y, x) * 180) / Math.PI;

export const average = (...nums) => {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};
export const sum3 = (a, b, c) => a + b + c;
export const factorial = (n) => {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('factorial expects a non-negative integer');
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};
export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
};
export const lcm = (a, b) => (a === 0 || b === 0 ? 0 : Math.abs((a / gcd(a, b)) * b));

export const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const weightedRandom = (items) => {
  if (!Array.isArray(items) || items.length === 0) throw new RangeError('weightedRandom expects a non-empty array');
  const total = items.reduce((s, it) => s + Math.max(0, Number(it.weight) || 0), 0);
  if (total <= 0) throw new RangeError('weightedRandom expects at least one positive weight');
  let r = Math.random() * total;
  for (const it of items) {
    r -= Math.max(0, Number(it.weight) || 0);
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpClamped = (a, b, t) => lerp(a, b, clamp(t, 0, 1));
export const mapRange = (x, inMin, inMax, outMin, outMax) => outMin + ((x - inMin) / (inMax - inMin)) * (outMax - outMin);
export const isBetween = (x, lo, hi) => x >= lo && x <= hi;

export const distance2d = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
export const distance3d = (x1, y1, z1, x2, y2, z2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

export const vec = {
  add: ([ax, ay, az], [bx, by, bz]) => [ax + bx, ay + by, az + bz],
  sub: ([ax, ay, az], [bx, by, bz]) => [ax - bx, ay - by, az - bz],
  dot: ([ax, ay, az], [bx, by, bz]) => ax * bx + ay * by + az * bz,
  cross: ([ax, ay, az], [bx, by, bz]) => [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx],
  normalize: ([x, y, z]) => {
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x / len, y / len, z / len];
  },
  angleBetween: (a, b) => {
    const d = vec.dot(vec.normalize(a), vec.normalize(b));
    return Math.acos(clamp(d, -1, 1)) * 180 / Math.PI;
  },
};
