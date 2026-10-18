// TITANBOT VIDA PROPIA — almacenamiento JSON con escritura atómica y validación.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = (process.env || {}).DATABASE_DIR || path.join(process.cwd(), 'database');
const DEFAULTS = {
  config: {}, memory: {}, events: {}, metrics: {}, cooldowns: {}, tasks: {}, audit: {},
  profiles: {}, seen: {}, ideas: {}, polls: {}, economy: {}, moderation: {}, state: {}
};
function file(name) { if (!/^[a-z0-9_-]+$/i.test(name)) throw new Error('Nombre de almacén no válido'); return path.join(ROOT, `vida_${name}.json`); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function read(name, fallback = {}) {
  try { const value = JSON.parse(fs.readFileSync(file(name), 'utf8')); return value && typeof value === 'object' ? value : clone(fallback); }
  catch (e) { if (e.code !== 'ENOENT' && !(e instanceof SyntaxError)) console.error('[VIDA:DB]', name, e.message); return clone(fallback); }
}
function write(name, value) {
  fs.mkdirSync(ROOT, { recursive: true });
  const target = file(name), temp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temp, target);
}
function update(name, fallback, mutator) { const data = read(name, fallback); const result = mutator(data); write(name, data); return result === undefined ? data : result; }
function ensureGroup(data, chat) { if (!data[chat] || typeof data[chat] !== 'object') data[chat] = {}; return data[chat]; }
function now() { return new Date().toISOString(); }
function id(prefix='vp') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`; }
function boundedText(input, max=1000) { return String(input ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0,max).trim(); }
function pruneMap(map, max=500) { const keys = Object.keys(map); if (keys.length <= max) return; keys.sort((a,b)=>(map[a]?.at||'').localeCompare(map[b]?.at||'')); for (const key of keys.slice(0, keys.length-max)) delete map[key]; }
module.exports = { ROOT, DEFAULTS, file, read, write, update, ensureGroup, now, id, boundedText, pruneMap };
