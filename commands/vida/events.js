// Eventos, encuestas e ideas con estados verificables.
'use strict';
const db=require('./storage');const safety=require('./safety');
function create(chat,title,description='',when='Por decidir',by='VIDA PROPIA') { const item={id:db.id('event'),title:safety.safeLabel(title,100),description:safety.cleanText(description,500),when:safety.safeLabel(when,100),createdBy:safety.safeLabel(by,80),createdAt:db.now(),status:'proposed',votes:{}};db.update('events',{},all=>{const l=all[chat]||(all[chat]=[]);l.push(item);all[chat]=l.slice(-100);});return item; }
function list(chat,status='') { return (db.read('events',{})[chat]||[]).filter(e=>!status||e.status===status).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
function changeStatus(chat,id,status) { if(!['proposed','confirmed','cancelled','completed'].includes(status))return false;let ok=false;db.update('events',{},all=>{const e=(all[chat]||[]).find(x=>x.id===id);if(e){e.status=status;e.updatedAt=db.now();ok=true;}});return ok; }
function vote(chat,id,user,choice) { let ok=false;db.update('events',{},all=>{const e=(all[chat]||[]).find(x=>x.id===id&&x.status!=='cancelled');if(e){e.votes[user]=safety.safeLabel(choice,80);ok=true;}});return ok; }
function tally(chat,id) { const e=list(chat).find(x=>x.id===id);if(!e)return null;const counts={};for(const v of Object.values(e.votes||{}))counts[v]=(counts[v]||0)+1;return {event:e,counts:Object.entries(counts).sort((a,b)=>b[1]-a[1])}; }
function addIdea(chat,text,by='VIDA PROPIA') { const idea={id:db.id('idea'),text:safety.cleanText(text,300),by:safety.safeLabel(by,80),at:db.now(),votes:0,status:'open'};db.update('ideas',{},all=>{const l=all[chat]||(all[chat]=[]);l.push(idea);all[chat]=l.slice(-200);});return idea; }
function ideas(chat) { return (db.read('ideas',{})[chat]||[]).slice(-50).reverse(); }
function voteIdea(chat,id,delta=1) { let result=null;db.update('ideas',{},all=>{const i=(all[chat]||[]).find(x=>x.id===id);if(i){i.votes=Math.max(0,(i.votes||0)+Math.sign(delta));result=i.votes;}});return result; }
module.exports={create,list,changeStatus,vote,tally,addIdea,ideas,voteIdea};
