// Agenda de tareas sencillas y recordatorios internos, sin timers permanentes por tarea.
'use strict';
const db=require('./storage'); const safety=require('./safety');
function add(chat,{title,at,kind='reminder',payload={}}) { const timestamp=Date.parse(at); if(!Number.isFinite(timestamp)||timestamp<Date.now()||timestamp>Date.now()+90*86400000) return {ok:false,error:'La fecha debe estar entre ahora y 90 días.'}; const task={id:db.id('task'),title:safety.safeLabel(title,100),at:new Date(timestamp).toISOString(),kind,payload,status:'pending',createdAt:db.now()}; db.update('tasks',{},all=>{const list=all[chat]||(all[chat]=[]);list.push(task);all[chat]=list.slice(-150);}); return {ok:true,task}; }
function list(chat,includeDone=false) { return (db.read('tasks',{})[chat]||[]).filter(t=>includeDone||t.status==='pending').sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)); }
function cancel(chat,id) { let found=false; db.update('tasks',{},all=>{const t=(all[chat]||[]).find(x=>x.id===id&&x.status==='pending');if(t){t.status='cancelled';t.updatedAt=db.now();found=true;}});return found; }
function due(chat,now=Date.now()) { const result=[]; db.update('tasks',{},all=>{for(const task of all[chat]||[])if(task.status==='pending'&&Date.parse(task.at)<=now){task.status='due';task.dueAt=db.now();result.push(task);}}); return result; }
function complete(chat,id) { let found=false; db.update('tasks',{},all=>{const t=(all[chat]||[]).find(x=>x.id===id);if(t){t.status='done';t.completedAt=db.now();found=true;}});return found; }
function cleanup(chat,days=120) { let removed=0; db.update('tasks',{},all=>{const list=all[chat]||[];all[chat]=list.filter(t=>{const keep=Date.now()-Date.parse(t.createdAt)<days*86400000;if(!keep)removed++;return keep;});});return removed; }
module.exports={add,list,cancel,due,complete,cleanup};
