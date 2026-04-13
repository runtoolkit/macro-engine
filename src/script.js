/**
 * Command script helpers.
 *
 * These helpers split multi-command scripts without ever evaluating code.
 * Separators are only treated as command boundaries when they appear outside
 * quotes and outside escape sequences.
 */

function normalizeLineEndings(input) {
  return String(input).replace(/\r\n?/g, '\n');
}

function pushToken(list, token) {
  const value = token.trim();
  if (value.length > 0) list.push(value);
}

export function splitCommandScript(input, { separators = [';', '\n'] } = {}) {
  if (typeof input !== 'string') throw new TypeError('Command script must be a string');

  const script = normalizeLineEndings(input);
  const boundary = new Set(Array.isArray(separators) ? separators.map(String) : [';', '\n']);
  const items = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const ch of script) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (boundary.has(ch)) {
      pushToken(items, current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (escaped) current += '\\';
  if (quote) throw new SyntaxError('Unclosed quote in command script');
  pushToken(items, current);
  return items;
}

export function joinCommandScript(commands, separator = ';\n') {
  if (!Array.isArray(commands)) throw new TypeError('Command list must be an array');
  const list = commands.map((item) => {
    if (typeof item !== 'string') throw new TypeError('Command list items must be strings');
    return item.trim();
  }).filter(Boolean);
  return list.join(separator);
}

export function parseCommandScript(input, options) {
  return splitCommandScript(input, options);
}
