/**
 * Math utilities — port of macro:math/*
 *
 * All functions are pure and stateless.
 * Integer-only where the original used integer scoreboards;
 * float-capable where JS allows.
 */

// ── basic ──────────────────────────────────────────────────────

export const abs   = (x)       => Math.abs(x);
export const sign  = (x)       => Math.sign(x);

/** sign but returns 1 for 0 (nonzero variant) */
export const signNonzero = (x) => x >= 0 ? 1 : -1;

export const min   = (a, b)    => Math.min(a, b);
export const max   = (a, b)    => Math.max(a, b);
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** min and max in one call → { min, max } */
export const minmax = (a, b)   => a <= b ? { min: a, max: b } : { min: b, max: a };

export const mod   = (x, m)    => ((x % m) + m) % m;

/** Wrap x into [lo, hi) */
export const wrap  = (x, lo, hi) => lo + mod(x - lo, hi - lo);

/** Integer ceiling division */
export const ceilDiv = (a, b)  => Math.ceil(a / b);

/** divmod → { quot, rem } */
export const divmod = (a, b)   => ({ quot: Math.trunc(a / b), rem: a % b });

/** Multiply then divide (integer-safe) */
export const mulDiv = (a, b, c) => (a * b) / c;

export const round = (x)       => Math.round(x);
export const sqrt  = (x)       => Math.sqrt(x);
export const pow   = (base, exp) => Math.pow(base, exp);
export const log2  = (x)       => Math.log2(x);

// ── trig ───────────────────────────────────────────────────────

export const sin   = (deg)     => Math.sin((deg * Math.PI) / 180);
export const cos   = (deg)     => Math.cos((deg * Math.PI) / 180);
export const atan2 = (y, x)    => (Math.atan2(y, x) * 180) / Math.PI;

// ── averages / combinatorics ───────────────────────────────────

export const average    = (...nums) => nums.reduce((a, b) => a + b, 0) / nums.length;
export const sum3       = (a, b, c) => a + b + c;
export const factorial  = (n)       => n <= 1 ? 1 : n * factorial(n - 1);
export const gcd        = (a, b)    => b === 0 ? a : gcd(b, a % b);
export const lcm        = (a, b)    => (a / gcd(a, b)) * b;

// ── random ─────────────────────────────────────────────────────

/** Integer random in [min, max] inclusive */
export const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Weighted random — pick from items by weight.
 * @param {{ value: *, weight: number }[]} items
 */
export const weightedRandom = (items) => {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
};

// ── interpolation ─────────────────────────────────────────────

export const lerp        = (a, b, t)    => a + (b - a) * t;
export const lerpClamped = (a, b, t)    => lerp(a, b, clamp(t, 0, 1));

/**
 * Map x from [inMin, inMax] to [outMin, outMax].
 */
export const mapRange = (x, inMin, inMax, outMin, outMax) =>
  outMin + ((x - inMin) / (inMax - inMin)) * (outMax - outMin);

// ── predicates ────────────────────────────────────────────────

export const isBetween = (x, lo, hi)  => x >= lo && x <= hi;

// ── geometry ──────────────────────────────────────────────────

export const distance2d = (x1, y1, x2, y2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const distance3d = (x1, y1, z1, x2, y2, z2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

// ── 3D vectors ────────────────────────────────────────────────

export const vec = {
  add:    ([ax,ay,az], [bx,by,bz]) => [ax+bx, ay+by, az+bz],
  sub:    ([ax,ay,az], [bx,by,bz]) => [ax-bx, ay-by, az-bz],
  dot:    ([ax,ay,az], [bx,by,bz]) => ax*bx + ay*by + az*bz,
  cross:  ([ax,ay,az], [bx,by,bz]) => [ay*bz-az*by, az*bx-ax*bz, ax*by-ay*bx],
  normalize: ([x,y,z]) => {
    const len = Math.sqrt(x*x + y*y + z*z) || 1;
    return [x/len, y/len, z/len];
  },
  angleBetween: (a, b) => {
    const d = vec.dot(vec.normalize(a), vec.normalize(b));
    return Math.acos(clamp(d, -1, 1)) * 180 / Math.PI;
  },
};
