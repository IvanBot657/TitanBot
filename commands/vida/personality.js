// Perfiles de personalidad y reglas de estilo por grupo.
'use strict';
const db=require('./storage');const safety=require('./safety');
const PRESETS={titan:'futurista, seguro, ingenioso y respetuoso',amigable:'cercano, alegre, amable y breve',sabio:'reflexivo, claro, curioso y respetuoso',comediante:'humor ligero, nunca humillante ni agresivo',moderador:'neutral, calmado, práctico y sin favoritismos'};
function get(chat) { const c=db.read('config',{})[chat]||{};return {personality:c.personality||PRESETS.titan,preset:c.preset||'titan',verbosity:c.verbosity||'breve',humor:c.humor!==false,enabled:!!c.enabled,probability:typeof c.probability==='number'?c.probability:.125,cooldownMs:c.cooldownMs||600000}; }
function setPreset(chat,preset) { if(!PRESETS[preset])return false;db.update('config',{},all=>{const c=all[chat]||(all[chat]={});c.preset=preset;c.personality=PRESETS[preset];c.updatedAt=db.now();});return true; }
function setPersonality(chat,text) { text=safety.safeLabel(text,220);if(text.length<4)return false;db.update('config',{},all=>{const c=all[chat]||(all[chat]={});c.personality=text;c.preset='custom';c.updatedAt=db.now();});return true; }
function setVerbosity(chat,value) { if(!['breve','normal','detallada'].includes(value))return false;db.update('config',{},all=>{const c=all[chat]||(all[chat]={});c.verbosity=value;});return true; }
function setProbability(chat,value) { value=Number(value);if(!Number.isFinite(value)||value<0||value>.5)return false;db.update('config',{},all=>{const c=all[chat]||(all[chat]={});c.probability=value;});return true; }
function presets() { return {...PRESETS}; }
module.exports={get,setPreset,setPersonality,setVerbosity,setProbability,presets};
