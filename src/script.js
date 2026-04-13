/**
 * script.js — safe multi-command script splitting.
 *
 * Supports:
 * - semicolons and newlines as separators
 * - quoted strings and escaped characters
 * - line comments starting with # or //
 */

function isWhitespace(ch) {
  return /\s/.test(ch);
}

export function splitScript(input) {
  if (typeof input !== 'string') throw new TypeError('Script must be a string');

  const commands = [];
  let current = '';
  let quote = null;
  let escaped = false;
  let lineStart = true;
  let inComment = false;

  const flush = () => {
    const value = current.trim();
    if (value) commands.push(value);
    current = '';
  };

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (inComment) {
      if (ch === '\n') {
        inComment = false;
        lineStart = true;
        flush();
      }
      continue;
    }

    if (escaped) {
      current += ch;
      escaped = false;
      lineStart = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escaped = true;
      lineStart = false;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      if (ch === '\n') lineStart = true;
      else lineStart = false;
      continue;
    }

    if (lineStart) {
      if (ch === '#' && current.trim().length === 0) {
        inComment = true;
        continue;
      }
      if (ch === '/' && next === '/' && current.trim().length === 0) {
        inComment = true;
        i += 1;
        continue;
      }
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      lineStart = false;
      continue;
    }

    if (ch === ';' || ch === '\n' || ch === '\r') {
      flush();
      lineStart = true;
      if (ch === '\r' && next === '\n') i += 1;
      continue;
    }

    current += ch;
    lineStart = isWhitespace(ch) ? lineStart : false;
  }

  if (quote) throw new SyntaxError('Unclosed quote in script');
  if (escaped) current += '\\';
  flush();
  return commands;
}

export class ScriptRunner {
  constructor(commandSystem) {
    if (!commandSystem || typeof commandSystem.runMany !== 'function') {
      throw new TypeError('ScriptRunner requires a command system with runMany()');
    }
    this.commandSystem = commandSystem;
  }

  async run(script, context = {}, options = {}) {
    return this.commandSystem.runMany(splitScript(script), context, options);
  }
}
