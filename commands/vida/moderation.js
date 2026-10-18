// Prevención no punitiva: detección de spam, flood y enlaces, sin sancionar automáticamente.
'use strict';
const db=require('./storage');const safety=require('./safety');
const history=new Map();
function inspect(chat,user,text,opts={}) { const now=Date.now(),key=`${chat}:${user}`,t=safety.cleanText(text,2000);const h=(history.get(key)||[]).filter(x=>now-x.at<30000);h.push({at:now,text:t});history.set(key,h);const reasons=[];if(h.length>=7)reasons.push('flood');if(h.filter(x=>x.text===t).length>=3&&t.length>0)reasons.push('repetición');if(opts.blockLinks&&safety.isUrl(t))reasons.push('enlace');const flagged=reasons.length>0;if(flagged)db.update('moderation',{},all=>{const list=all[chat]||(all[chat]=[]);list.push({id:db.id('mod'),user:String(user).slice(0,100),reasons,text:t.slice(0,180),at:db.now(),status:'review'});all[chat]=list.slice(-200);});return {flagged,reasons,count:h.length,action:'review_only'}; }
function list(chat) { return (db.read('moderation',{})[chat]||[]).slice(-50).reverse(); }
function resolve(chat,id,status='reviewed') { if(!['reviewed','ignored'].includes(status))return false;let ok=false;db.update('moderation',{},all=>{const x=(all[chat]||[]).find(i=>i.id===id);if(x){x.status=status;x.resolvedAt=db.now();ok=true;}});return ok; }
function clearOld(chat,days=14) { let removed=0;db.update('moderation',{},all=>{const cutoff=Date.now()-days*86400000;const l=all[chat]||[];all[chat]=l.filter(x=>{const keep=Date.parse(x.at)>cutoff;if(!keep)removed++;return keep;});});return removed; }
function stats(chat) { const l=db.read('moderation',{})[chat]||[];return {total:l.length,pending:l.filter(x=>x.status==='review').length}; }
module.exports={inspect,list,resolve,clearOld,stats};
