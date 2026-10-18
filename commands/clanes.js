// ============================================
// TITANBOT - SISTEMA DE CLANES MALDITOS
// Sin IA ni API de pago. Persistencia en JSON.
// Regla general de medios: cualquier GIF futuro
// debe buscarse en la web, nunca generarse con IA.
// ============================================
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');
const CLANES_FILE = path.join(DB_DIR, 'clanes.json');
const GUERRAS_FILE = path.join(DB_DIR, 'guerras_clanes.json');
const MAX_MIEMBROS = 10;
const RANGOS = ['miembro', 'elite', 'sub lider', 'líder'];
const COMANDOS = new Set([
  'crearclan','clan','claninfo','clanes','unirme','salirclan',
  'invitarclan','aceptarclan','rechazarclan','rangoclan','expulsarclan','disolverclan',
  'ritualclan','maldicionclan','proteccionclan','entrenarclan',
  'guerraclan','aceptarguerra','rechazarguerra','atacarclan','rankingclan','historialclan'
]);

function preparar() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(CLANES_FILE)) fs.writeFileSync(CLANES_FILE, JSON.stringify({ clanes: {}, jugadorClan: {}, invitaciones: {} }, null, 2));
  if (!fs.existsSync(GUERRAS_FILE)) fs.writeFileSync(GUERRAS_FILE, JSON.stringify({ pendiente: null, historial: [], activa: null }, null, 2));
}
function leerArchivo(file, fallback) {
  preparar();
  try { const x = JSON.parse(fs.readFileSync(file, 'utf8')); return x && typeof x === 'object' ? x : fallback; }
  catch (e) { console.error('[CLANES] Error leyendo ' + path.basename(file) + ':', e.message); return fallback; }
}
function guardarArchivo(file, data) { preparar(); fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
function cargarClanes() {
  const d = leerArchivo(CLANES_FILE, {});
  if (!d.clanes || typeof d.clanes !== 'object') d.clanes = {};
  if (!d.jugadorClan || typeof d.jugadorClan !== 'object') d.jugadorClan = {};
  if (!d.invitaciones || typeof d.invitaciones !== 'object') d.invitaciones = {};
  return d;
}
function cargarGuerras() {
  const d = leerArchivo(GUERRAS_FILE, {});
  if (!Array.isArray(d.historial)) d.historial = [];
  if (!('pendiente' in d)) d.pendiente = null;
  if (!('activa' in d)) d.activa = null;
  return d;
}
function guardarClanes(d) { guardarArchivo(CLANES_FILE, d); }
function guardarGuerras(d) { guardarArchivo(GUERRAS_FILE, d); }
function normalizar(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function nombreClan(d, nombre) {
  const n = normalizar(nombre);
  return Object.values(d.clanes).find(c => normalizar(c.nombre) === n) || null;
}
function miClan(d, jid) { const cid = d.jugadorClan[jid]; return cid ? d.clanes[cid] || null : null; }
function rango(c, jid) { return c?.miembros?.[jid]?.rango || null; }
function puedeGestionar(c, jid) { return ['líder','sub lider'].includes(rango(c, jid)); }
function esLider(c, jid) { return rango(c, jid) === 'líder'; }
function crearId() { return 'clan_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function crearIdGuerra() { return 'war_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function mentionId(msg) {
  const ctx = msg?.message?.extendedTextMessage?.contextInfo || msg?.message?.imageMessage?.contextInfo || msg?.message?.videoMessage?.contextInfo || {};
  return Array.isArray(ctx.mentionedJid) ? ctx.mentionedJid[0] : null;
}
function usuarioBonito(jid) { return '@' + String(jid || '').split('@')[0]; }
function lineasMiembros(c) {
  const arr = Object.entries(c.miembros || {});
  if (!arr.length) return '┃ • Sin miembros';
  return arr.map(([jid, m]) => `┃ • ${usuarioBonito(jid)} — ${m.rango}`).join('\n');
}
function subirNivel(c) {
  let subio = false;
  while (c.nivel < 10 && c.xp >= c.nivel * 100) { c.xp -= c.nivel * 100; c.nivel++; subio = true; }
  return subio;
}
function clanCard(c) {
  const miembros = Object.keys(c.miembros || {}).length;
  return `╭━━━〔 ☠️ ${c.nombre.toUpperCase()} 〕━━━╮\n┃ 🕯️ Nivel: ${c.nivel}\n┃ 🔮 Experiencia: ${c.xp}\n┃ 👥 Miembros: ${miembros}/${MAX_MIEMBROS}\n┃ ⚔️ Puntos de guerra: ${c.puntosGuerra}\n┃ 🏆 Victorias: ${c.victorias}\n┃ 💀 Derrotas: ${c.derrotas}\n╰━━━━━━━━━━━━━━━━━━━━╯`;
}
function bando(g, clanId) { return g.clanA === clanId ? 'A' : (g.clanB === clanId ? 'B' : null); }
function requerido(c) { return Math.min(3, Math.max(1, Object.keys(c.miembros || {}).length)); }
function cerrarGuerra(d, gd) {
  const g = gd.activa;
  if (!g) return null;
  const a = d.clanes[g.clanA], b = d.clanes[g.clanB];
  if (!a || !b) { g.estado = 'cancelada'; gd.historial.unshift(g); gd.historial = gd.historial.slice(0, 100); gd.activa = null; guardarGuerras(gd); return 'cancelada'; }
  let ganador = null;
  if (g.puntos.A > g.puntos.B) ganador = a;
  else if (g.puntos.B > g.puntos.A) ganador = b;
  if (ganador) {
    ganador.puntosGuerra += 100; ganador.victorias++;
    const perdedor = ganador.id === a.id ? b : a; perdedor.derrotas++;
    g.ganador = ganador.id; g.estado = 'finalizada';
  } else { g.ganador = null; g.estado = 'empate'; }
  g.finalizadaEn = Date.now();
  gd.historial.unshift(g); gd.historial = gd.historial.slice(0, 100); gd.activa = null;
  guardarClanes(d); guardarGuerras(gd);
  return ganador ? ganador.nombre : 'empate';
}

async function enviar(sock, chat, text, mentions = []) {
  const payload = { text };
  if (mentions.length) payload.mentions = mentions;
  await sock.sendMessage(chat, payload);
}

async function clanes(sock, chat, comando, args, id, msg) {
  if (!COMANDOS.has(comando)) return false;
  const d = cargarClanes();
  const gd = cargarGuerras();
  const nombreArg = args.join(' ').trim();
  const clan = miClan(d, id);
  const citado = mentionId(msg);

  switch (comando) {
    case 'crearclan': {
      const nombre = nombreArg.replace(/[<>]/g, '').trim();
      if (clan) return enviar(sock, chat, '☠️ Ya perteneces al clan *' + clan.nombre + '*. Sal primero con .salirclan.');
      if (nombre.length < 3 || nombre.length > 24) return enviar(sock, chat, '📜 Usa: *.crearclan <nombre>*\nEl nombre debe tener entre 3 y 24 caracteres.');
      if (nombreClan(d, nombre)) return enviar(sock, chat, '☠️ Ya existe un clan con ese nombre.');
      const cid = crearId();
      const nuevo = { id: cid, nombre, creadoPor: id, creadoEn: Date.now(), nivel: 1, xp: 0, puntosGuerra: 0, victorias: 0, derrotas: 0, ritualUltimo: 0, entrenamientoUltimo: 0, miembros: { [id]: { rango: 'líder', unidoEn: Date.now() } } };
      d.clanes[cid] = nuevo; d.jugadorClan[id] = cid; guardarClanes(d);
      return enviar(sock, chat, '🌑 *EL PACTO HA SIDO SELLADO*\n\nEl clan *' + nombre + '* ha nacido.\n🕯️ Fundador: ' + usuarioBonito(id) + '\n💰 Coste: Gratis\n\nUsa *.clan* para ver tu clan y *.invitarclan @usuario* para reclutar.', [id]);
    }
    case 'clan':
    case 'claninfo': {
      if (!clan) return enviar(sock, chat, '🌑 No perteneces a ningún clan.\nCrea uno gratis con *.crearclan <nombre>* o usa *.clanes*.');
      return enviar(sock, chat, clanCard(clan) + '\n\n╭━━〔 👥 MIEMBROS 〕━━╮\n' + lineasMiembros(clan) + '\n╰━━━━━━━━━━━━━━━━━━╯');
    }
    case 'clanes': {
      const lista = Object.values(d.clanes).sort((a,b) => b.puntosGuerra-a.puntosGuerra || b.victorias-a.victorias);
      if (!lista.length) return enviar(sock, chat, '🌫️ Todavía no existen clanes. Sé el primero con *.crearclan <nombre>*.');
      return enviar(sock, chat, '╭━━━〔 🌑 CLANES EXISTENTES 〕━━━╮\n' + lista.slice(0, 20).map((c,i) => `┃ ${i+1}. ${c.nombre} — Nv.${c.nivel} · ${Object.keys(c.miembros).length}/${MAX_MIEMBROS}`).join('\n') + '\n╰━━━━━━━━━━━━━━━━━━━━╯');
    }
    case 'unirme': {
      if (clan) return enviar(sock, chat, '☠️ Ya perteneces a *' + clan.nombre + '*.');
      const target = nombreClan(d, nombreArg);
      if (!target) return enviar(sock, chat, '🔎 No encontré ese clan. Consulta la lista con *.clanes*.');
      if (Object.keys(target.miembros).length >= MAX_MIEMBROS) return enviar(sock, chat, '⛓️ Ese clan alcanzó el límite de ' + MAX_MIEMBROS + ' miembros.');
      d.jugadorClan[id] = target.id; target.miembros[id] = { rango: 'miembro', unidoEn: Date.now() }; guardarClanes(d);
      return enviar(sock, chat, '🔮 Te has unido al clan *' + target.nombre + '*.');
    }
    case 'salirclan': {
      if (!clan) return enviar(sock, chat, '🌫️ No perteneces a ningún clan.');
      if (esLider(clan, id)) return enviar(sock, chat, '👑 El líder no puede abandonar su clan. Usa *.disolverclan* para disolverlo o transfiere el liderazgo con *.rangoclan @usuario líder*.');
      delete clan.miembros[id]; delete d.jugadorClan[id]; guardarClanes(d);
      return enviar(sock, chat, '🌑 Has abandonado el clan *' + clan.nombre + '*.');
    }
    case 'invitarclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      if (!puedeGestionar(clan, id)) return enviar(sock, chat, '🔒 Solo el líder o sublíder puede invitar.');
      if (!citado) return enviar(sock, chat, '📜 Menciona a quien deseas invitar: *.invitarclan @usuario*');
      if (d.jugadorClan[citado]) return enviar(sock, chat, '☠️ Ese usuario ya pertenece a un clan.');
      if (Object.keys(clan.miembros).length >= MAX_MIEMBROS) return enviar(sock, chat, '⛓️ El clan está lleno.');
      d.invitaciones[citado] = { clanId: clan.id, invitadoPor: id, creadaEn: Date.now() }; guardarClanes(d);
      return enviar(sock, chat, '🕯️ Invitación enviada a ' + usuarioBonito(citado) + '. Puede usar *.aceptarclan* o *.rechazarclan*.', [citado]);
    }
    case 'aceptarclan': {
      if (clan) return enviar(sock, chat, '☠️ Ya perteneces a *' + clan.nombre + '*.');
      const inv = d.invitaciones[id];
      if (!inv || Date.now() - inv.creadaEn > 24*60*60*1000) { delete d.invitaciones[id]; guardarClanes(d); return enviar(sock, chat, '📜 No tienes invitaciones vigentes.'); }
      const destino = d.clanes[inv.clanId];
      if (!destino || Object.keys(destino.miembros).length >= MAX_MIEMBROS) return enviar(sock, chat, '⛓️ El clan ya no existe o está lleno.');
      d.jugadorClan[id] = destino.id; destino.miembros[id] = { rango: 'miembro', unidoEn: Date.now() }; delete d.invitaciones[id]; guardarClanes(d);
      return enviar(sock, chat, '🔮 Has aceptado la invitación y ahora perteneces a *' + destino.nombre + '*.');
    }
    case 'rechazarclan': {
      if (!d.invitaciones[id]) return enviar(sock, chat, '📜 No tienes invitaciones pendientes.');
      delete d.invitaciones[id]; guardarClanes(d); return enviar(sock, chat, '🕯️ Invitación rechazada.');
    }
    case 'rangoclan': {
      if (!clan) return enviar(sock, chat, '🌫️ No perteneces a un clan.');
      if (!esLider(clan, id)) return enviar(sock, chat, '🔒 Solo el líder puede cambiar rangos.');
      if (!citado || !clan.miembros[citado]) return enviar(sock, chat, '📜 Menciona a un miembro de tu clan.');
      const rangoNuevo = normalizar(args.slice(1).join(' '));
      const mapa = { miembro: 'miembro', elite: 'elite', 'élite': 'elite', sublider: 'sub lider', 'sub lider': 'sub lider', lider: 'líder', 'líder': 'líder' };
      const elegido = mapa[rangoNuevo];
      if (!elegido) return enviar(sock, chat, 'Rangos disponibles: miembro, elite, sub lider, líder.');
      if (citado === id && elegido !== 'líder') return enviar(sock, chat, '👑 No puedes quitarte el liderazgo de esta forma.');
      if (elegido === 'líder') { const antiguo = Object.keys(clan.miembros).find(j => clan.miembros[j].rango === 'líder'); if (antiguo) clan.miembros[antiguo].rango = 'sub lider'; }
      clan.miembros[citado].rango = elegido; guardarClanes(d);
      return enviar(sock, chat, '🔮 Rango de ' + usuarioBonito(citado) + ' actualizado a *' + elegido + '*.', [citado]);
    }
    case 'expulsarclan': {
      if (!clan) return enviar(sock, chat, '🌫️ No perteneces a un clan.');
      if (!puedeGestionar(clan, id)) return enviar(sock, chat, '🔒 Solo líder o sublíder puede expulsar.');
      if (!citado || !clan.miembros[citado]) return enviar(sock, chat, '📜 Menciona a un miembro de tu clan.');
      if (citado === id || esLider(clan, citado) || (rango(clan, id) !== 'líder' && rango(clan, citado) === 'sub lider')) return enviar(sock, chat, '🔒 No tienes permiso para expulsar a ese miembro.');
      delete clan.miembros[citado]; delete d.jugadorClan[citado]; guardarClanes(d);
      return enviar(sock, chat, '☠️ ' + usuarioBonito(citado) + ' ha sido expulsado del clan *' + clan.nombre + '*.', [citado]);
    }
    case 'disolverclan': {
      if (!clan) return enviar(sock, chat, '🌫️ No perteneces a un clan.');
      if (!esLider(clan, id)) return enviar(sock, chat, '🔒 Solo el líder puede disolver el clan.');
      const nombre = clan.nombre;
      for (const jid of Object.keys(clan.miembros)) delete d.jugadorClan[jid];
      for (const [jid, inv] of Object.entries(d.invitaciones)) if (inv.clanId === clan.id) delete d.invitaciones[jid];
      delete d.clanes[clan.id];
      if (gd.pendiente && (gd.pendiente.clanA === clan.id || gd.pendiente.clanB === clan.id)) gd.pendiente = null;
      if (gd.activa && (gd.activa.clanA === clan.id || gd.activa.clanB === clan.id)) { gd.activa.estado = 'cancelada'; gd.historial.unshift(gd.activa); gd.activa = null; }
      guardarClanes(d); guardarGuerras(gd);
      return enviar(sock, chat, '🌑 El clan *' + nombre + '* ha sido disuelto por su líder.');
    }
    case 'ritualclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      if (Date.now() - clan.ritualUltimo < 6*60*60*1000) return enviar(sock, chat, '🕯️ El ritual está agotado. Vuelve más tarde.');
      clan.ritualUltimo = Date.now(); clan.xp += 25; const subio = subirNivel(clan); guardarClanes(d);
      return enviar(sock, chat, '🕯️ *RITUAL DEL ABISMO*\nEl clan *' + clan.nombre + '* obtiene 25 XP.' + (subio ? '\n🌑 ¡El clan subió al nivel ' + clan.nivel + '!' : '') );
    }
    case 'entrenarclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      if (Date.now() - clan.entrenamientoUltimo < 12*60*60*1000) return enviar(sock, chat, '🔮 El clan ya entrenó recientemente. Vuelve más tarde.');
      clan.entrenamientoUltimo = Date.now(); clan.xp += 40; const subio = subirNivel(clan); guardarClanes(d);
      return enviar(sock, chat, '⚔️ El entrenamiento otorga 40 XP al clan *' + clan.nombre + '*.' + (subio ? '\n🌑 ¡Nuevo nivel: ' + clan.nivel + '!' : ''));
    }
    case 'maldicionclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      if (!gd.activa || !bando(gd.activa, clan.id)) return enviar(sock, chat, '☠️ Solo puedes lanzar esta maldición durante una guerra activa de tu clan.');
      const lado = bando(gd.activa, clan.id), otro = lado === 'A' ? 'B' : 'A';
      if (gd.activa.maldicionUsada?.[lado]) return enviar(sock, chat, '🕯️ Tu clan ya usó su maldición en esta guerra.');
      gd.activa.maldicionUsada ||= { A: false, B: false };
      gd.activa.maldicionUsada[lado] = true;
      const bonus = 15; gd.activa.puntos[lado] += bonus; guardarGuerras(gd);
      return enviar(sock, chat, '☠️ *MALDICIÓN DEL ABISMO*\nEl hechizo de *' + clan.nombre + '* añade +' + bonus + ' puntos a su marcador de guerra.');
    }
    case 'proteccionclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      if (!gd.activa || !bando(gd.activa, clan.id)) return enviar(sock, chat, '🛡️ La protección solo puede activarse durante una guerra de tu clan.');
      const lado = bando(gd.activa, clan.id);
      gd.activa.proteccion ||= { A: false, B: false };
      if (gd.activa.proteccion[lado]) return enviar(sock, chat, '🛡️ La protección ya está activa.');
      gd.activa.proteccion[lado] = true; guardarGuerras(gd);
      return enviar(sock, chat, '🛡️ El sello protector de *' + clan.nombre + '* reducirá el próximo ataque enemigo en 10 puntos.');
    }
    case 'guerraclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      if (!puedeGestionar(clan, id)) return enviar(sock, chat, '🔒 Solo líder o sublíder puede declarar una guerra.');
      if (gd.activa || gd.pendiente) return enviar(sock, chat, '⚔️ Ya existe una guerra activa o una invitación de guerra pendiente.');
      const objetivo = nombreClan(d, nombreArg);
      if (!objetivo) return enviar(sock, chat, '🔎 No encontré ese clan. Usa *.clanes*.');
      if (objetivo.id === clan.id) return enviar(sock, chat, '☠️ No puedes declarar guerra a tu propio clan.');
      gd.pendiente = { id: crearIdGuerra(), clanA: clan.id, clanB: objetivo.id, creadaEn: Date.now(), solicitante: id };
      guardarGuerras(gd);
      return enviar(sock, chat, '╭━━━〔 ⚔️ DESAFÍO DE CLAN 〕━━━╮\n┃ ☠️ *' + clan.nombre + '* desafía a\n┃ 🌑 *' + objetivo.nombre + '*\n┃\n┃ El líder o sublíder defensor\n┃ puede usar .aceptarguerra\n┃ o .rechazarguerra\n╰━━━━━━━━━━━━━━━━━━━━╯');
    }
    case 'aceptarguerra':
    case 'rechazarguerra': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      const p = gd.pendiente;
      if (!p || p.clanB !== clan.id) return enviar(sock, chat, '📜 Tu clan no tiene un desafío de guerra pendiente.');
      if (!puedeGestionar(clan, id)) return enviar(sock, chat, '🔒 Solo líder o sublíder puede responder al desafío.');
      if (comando === 'rechazarguerra') { gd.pendiente = null; guardarGuerras(gd); return enviar(sock, chat, '🕯️ El clan *' + clan.nombre + '* rechazó el desafío.'); }
      const a = d.clanes[p.clanA], b = d.clanes[p.clanB];
      if (!a || !b) { gd.pendiente = null; guardarGuerras(gd); return enviar(sock, chat, '☠️ No se pudo iniciar: uno de los clanes ya no existe.'); }
      gd.activa = { id: p.id, clanA: a.id, clanB: b.id, estado: 'activa', iniciadaEn: Date.now(), puntos: { A: 0, B: 0 }, ataques: { A: 0, B: 0 }, atacantes: {}, maldicionUsada: { A: false, B: false }, proteccion: { A: false, B: false } };
      gd.pendiente = null; guardarGuerras(gd);
      return enviar(sock, chat, '⚔️ *¡LA GUERRA HA COMENZADO!*\n\n☠️ ' + a.nombre + ' vs ' + b.nombre + '\n\nCada miembro puede atacar una vez con *.atacarclan*. Los ataques otorgan puntos y el ganador suma 100 puntos de guerra.');
    }
    case 'atacarclan': {
      if (!clan) return enviar(sock, chat, '🌫️ Debes pertenecer a un clan.');
      const g = gd.activa;
      if (!g || !bando(g, clan.id)) return enviar(sock, chat, '⚔️ Tu clan no tiene una guerra activa.');
      if (g.atacantes[id]) return enviar(sock, chat, '🗡️ Ya atacaste en esta guerra. Cada miembro tiene un ataque.');
      const lado = bando(g, clan.id), otro = lado === 'A' ? 'B' : 'A';
      const enemigoId = lado === 'A' ? g.clanB : g.clanA;
      const enemigo = d.clanes[enemigoId];
      if (g.ataques[lado] >= requerido(clan)) return enviar(sock, chat, '🕯️ Tu clan ya agotó sus ataques para esta guerra.');
      let puntos = Math.floor(Math.random() * 16) + 10;
      if (g.proteccion?.[otro]) { puntos = Math.max(0, puntos - 10); g.proteccion[otro] = false; }
      g.atacantes[id] = true; g.ataques[lado]++; g.puntos[lado] += puntos;
      const finA = g.ataques.A >= requerido(d.clanes[g.clanA]);
      const finB = g.ataques.B >= requerido(d.clanes[g.clanB]);
      guardarGuerras(gd);
      let texto = '🗡️ *ATAQUE DE GUERRA*\n' + usuarioBonito(id) + ' ataca por *' + clan.nombre + '* y consigue +' + puntos + ' puntos.\n\n⚔️ ' + d.clanes[g.clanA].nombre + ': ' + g.puntos.A + ' (' + g.ataques.A + '/' + requerido(d.clanes[g.clanA]) + ')\n⚔️ ' + d.clanes[g.clanB].nombre + ': ' + g.puntos.B + ' (' + g.ataques.B + '/' + requerido(d.clanes[g.clanB]) + ')';
      if (finA && finB) {
        const resultado = cerrarGuerra(d, gd);
        texto += '\n\n' + (resultado === 'empate' ? '⚖️ ¡La guerra termina en empate!' : '🏆 ¡' + resultado + ' gana la guerra y obtiene 100 puntos de guerra!');
      }
      return enviar(sock, chat, texto, [id]);
    }
    case 'rankingclan': {
      const lista = Object.values(d.clanes).sort((a,b) => b.puntosGuerra-a.puntosGuerra || b.victorias-a.victorias || b.nivel-a.nivel);
      if (!lista.length) return enviar(sock, chat, '🌫️ Aún no hay clanes para clasificar.');
      return enviar(sock, chat, '╭━━━〔 🏆 RANKING MALDITO 〕━━━╮\n' + lista.slice(0, 15).map((c,i) => `┃ ${i+1}. ${c.nombre}\n┃    ⚔️ ${c.puntosGuerra} pts · 🏆 ${c.victorias} victorias · Nv.${c.nivel}`).join('\n') + '\n╰━━━━━━━━━━━━━━━━━━━━╯');
    }
    case 'historialclan': {
      const hist = gd.historial.filter(g => !clan || g.clanA === clan.id || g.clanB === clan.id).slice(0, 10);
      if (!hist.length) return enviar(sock, chat, '📜 No hay guerras registradas para mostrar.');
      return enviar(sock, chat, '╭━━━〔 📜 HISTORIAL DE GUERRAS 〕━━━╮\n' + hist.map(g => { const a=d.clanes[g.clanA]?.nombre || 'Clan disuelto'; const b=d.clanes[g.clanB]?.nombre || 'Clan disuelto'; const w=g.ganador ? (d.clanes[g.ganador]?.nombre || 'Clan disuelto') : (g.estado === 'empate' ? 'Empate' : 'Cancelada'); return `┃ ${a} vs ${b}\n┃ Resultado: ${w}`; }).join('\n') + '\n╰━━━━━━━━━━━━━━━━━━━━╯');
    }
  }
  return false;
}

clanes.comandos = COMANDOS;
module.exports = clanes;
