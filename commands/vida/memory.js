// Memoria por grupo: recuerdos explícitos, resumen conversacional y preferencias con caducidad.
'use strict';
const db = require('./storage');
const safety = require('./safety');
const MAX_FACTS = 80, MAX_TURNS = 30, TTL_DAYS = 90;
function bucket(chat) { const all=db.read('memory',{}); return all[chat] || { facts:[], turns:[], preferences:{}, summary:'', updated:db.now() }; }
function save(chat, data) { const all=db.read('memory',{}); all[chat]=data; db.write('memory',all); }
function expire(data) { const cutoff=Date.now()-TTL_DAYS*86400000; data.facts=(data.facts||[]).filter(f=>Date.parse(f.createdAt||0)>cutoff); data.turns=(data.turns||[]).filter(t=>Date.parse(t.at||0)>cutoff).slice(-MAX_TURNS); return data; }
function addFact(chat, text, source='grupo') {
  text=safety.cleanText(text,240); if(text.length<4) return {ok:false,reason:'muy_corto'};
  const data=expire(bucket(chat)); const norm=text.toLowerCase();
  if(data.facts.some(f=>f.text.toLowerCase()===norm)) return {ok:true,duplicate:true};
  data.facts.push({id:db.id('fact'),text,source,createdAt:db.now()}); data.facts=data.facts.slice(-MAX_FACTS); data.updated=db.now(); save(chat,data); return {ok:true};
}
function removeFact(chat, query) { const data=bucket(chat), q=String(query||'').toLowerCase(); const index=data.facts.findIndex(f=>f.id===query||f.text.toLowerCase().includes(q)); if(index<0)return false; const removed=data.facts.splice(index,1)[0]; save(chat,data); return removed; }
function addTurn(chat, role, text, user='') { const data=expire(bucket(chat)); data.turns.push({role:role==='assistant'?'assistant':'user',text:safety.cleanText(text,450),user:safety.safeLabel(user,60),at:db.now()}); data.turns=data.turns.slice(-MAX_TURNS); data.updated=db.now(); save(chat,data); }
function setPreference(chat,key,value) { const data=bucket(chat); key=safety.safeLabel(key,50); value=safety.safeLabel(value,120); if(!key||!value)return false; data.preferences[key]=value; data.updated=db.now(); save(chat,data); return true; }
function setSummary(chat,summary) { const data=bucket(chat); data.summary=safety.cleanText(summary,1200); data.updated=db.now(); save(chat,data); }
function context(chat, max=2200) { const d=expire(bucket(chat)); const chunks=[]; if(d.summary)chunks.push('Resumen: '+d.summary); const facts=d.facts.slice(-18); if(facts.length)chunks.push('Recuerdos del grupo:\n'+facts.map(f=>'- '+f.text).join('\n')); const prefs=Object.entries(d.preferences).slice(0,15); if(prefs.length)chunks.push('Preferencias: '+prefs.map(([k,v])=>`${k}: ${v}`).join('; ')); chunks.push('Conversación reciente:\n'+d.turns.slice(-8).map(t=>`${t.user||t.role}: ${t.text}`).join('\n')); return chunks.join('\n\n').slice(-max); }
function listFacts(chat) { return expire(bucket(chat)).facts.slice(-MAX_FACTS); }
function clear(chat) { const all=db.read('memory',{}); delete all[chat]; db.write('memory',all); return true; }
function stats(chat) { const d=bucket(chat); return {facts:d.facts.length,turns:d.turns.length,preferences:Object.keys(d.preferences).length,updated:d.updated}; }
function redact(text) { return String(text||'').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[correo]').replace(/\b\d{7,}\b/g,'[número]'); }
module.exports={bucket,addFact,removeFact,addTurn,setPreference,setSummary,context,listFacts,clear,stats,redact,expire};
