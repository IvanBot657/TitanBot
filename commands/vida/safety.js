// Políticas de acciones: solo funciones explícitas; jamás eval, exec o código generado por IA.
'use strict';
const ALLOWED = new Set(['reply','suggest_game','start_poll','create_event','show_status','remember_fact','forget_fact','give_prompt','announce_safe','run_existing_command']);
const DENIED = new Set(['delete_messages','ban_member','promote_admin','demote_admin','change_group_settings','send_private_message','read_private_data','run_shell','eval','exec','install_package','modify_source']);
const MAX_ARGS = 12, MAX_ARG_LENGTH = 600;
function normalizeAction(action) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) return null;
  const type = String(action.type || '').trim().toLowerCase();
  if (!ALLOWED.has(type) || DENIED.has(type)) return null;
  const args = action.args && typeof action.args === 'object' && !Array.isArray(action.args) ? action.args : {};
  const clean = {};
  for (const [key,value] of Object.entries(args).slice(0, MAX_ARGS)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
    if (typeof value === 'string') clean[key] = value.replace(/[\u0000-\u001f]/g,'').slice(0,MAX_ARG_LENGTH);
    else if (typeof value === 'number' && Number.isFinite(value)) clean[key] = Math.max(-1e6,Math.min(1e6,value));
    else if (typeof value === 'boolean' || value === null) clean[key] = value;
  }
  return { type, args: clean };
}
function cleanText(text, max=1200) { return String(text ?? '').replace(/@everyone|@all/gi,'grupo').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,max).trim(); }
function isGroup(chat) { return typeof chat === 'string' && chat.endsWith('@g.us'); }
function isCommand(text, prefix='.') { return String(text||'').trim().startsWith(prefix); }
function isUrl(text) { try { const u = new URL(String(text)); return ['http:','https:'].includes(u.protocol); } catch { return false; } }
function safeLabel(text, max=80) { return cleanText(text,max).replace(/[<>`]/g,''); }
function allowedAction(type) { return ALLOWED.has(String(type||'')); }
function needsAdmin(type) { return ['create_event','start_poll','announce_safe'].includes(type); }
function checkRate(last, now=Date.now(), gap=5000) { return now - Number(last||0) >= gap; }
function safeError(err) { return String(err?.message || err || 'Error desconocido').replace(/(key|token|password|secret)\s*[:=]\s*\S+/ig,'$1=[oculto]').slice(0,240); }
module.exports = { ALLOWED, DENIED, normalizeAction, cleanText, isGroup, isCommand, isUrl, safeLabel, allowedAction, needsAdmin, checkRate, safeError };
