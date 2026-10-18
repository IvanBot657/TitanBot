// Métricas y auditoría resumida por grupo.
'use strict';
const db=require('./storage');
function increment(chat,key,amount=1) { db.update('metrics',{},all=>{const m=all[chat]||(all[chat]={});m[key]=Math.max(0,Number(m[key]||0)+amount);m.updatedAt=db.now();}); }
function record(chat,type,meta={}) { db.update('metrics',{},all=>{const m=all[chat]||(all[chat]={});m.timeline=m.timeline||[];m.timeline.push({type:String(type).slice(0,60),meta,at:db.now()});m.timeline=m.timeline.slice(-500);m.updatedAt=db.now();}); }
function report(chat) { const m=db.read('metrics',{})[chat]||{};return {messages:m.messages||0,actions:m.actions||0,errors:m.errors||0,lastSpoke:m.lastSpoke?new Date(m.lastSpoke).toISOString():null,recent:(m.timeline||[]).slice(-15)}; }
function topActions(chat) { const a=db.read('audit',{})[chat]||[],counts={};for(const item of a)counts[item.type]=(counts[item.type]||0)+1;return Object.entries(counts).sort((x,y)=>y[1]-x[1]).slice(0,10).map(([action,count])=>({action,count})); }
function reset(chat) { const all=db.read('metrics',{});delete all[chat];db.write('metrics',all);return true; }
function daily(chat) { const since=Date.now()-86400000;const m=db.read('metrics',{})[chat]||{};return {messages:m.messages||0,speeches:(m.speech||[]).filter(t=>t>since).length,events:(m.timeline||[]).filter(t=>Date.parse(t.at)>since).length}; }
module.exports={increment,record,report,topActions,reset,daily};
