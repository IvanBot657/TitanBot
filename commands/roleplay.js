// commands/roleplay.js

const axios = require("axios");

const GIPHY_API = "https://api.giphy.com/v1/gifs/search";

const acciones = {
  abrazar: {
    emoji: "🫂",
    texto: "Yo abrazo a",
    busqueda: "anime hug"
  },

  besar: {
    emoji: "💋",
    texto: "Le mando un besito amistoso a",
    busqueda: "anime friendly kiss"
  },

  golpear: {
    emoji: "👊",
    texto: "Yo golpeo a",
    busqueda: "anime punch"
  },

  patada: {
    emoji: "🦵",
    texto: "Yo doy una patada de juego a",
    busqueda: "anime kick"
  },

  saludo: {
    emoji: "👋",
    texto: "Yo saludo a",
    busqueda: "anime wave hello"
  },

  felicitar: {
    emoji: "🎉",
    texto: "Yo felicito a",
    busqueda: "anime congratulations"
  },

  reir: {
    emoji: "😂",
    texto: "Yo río con",
    busqueda: "anime laughing"
  },

  llorar: {
    emoji: "😭",
    texto: "Yo lloro con",
    busqueda: "anime crying"
  },

  enojado: {
    emoji: "😡",
    texto: "Yo me enojo con",
    busqueda: "anime angry"
  },

  bailar: {
    emoji: "💃",
    texto: "Yo bailo con",
    busqueda: "anime dance"
  }
};

async function roleplay(sock, chat, comando, args = [], id, msg) {

  try {

    if (!sock || !chat) {
      console.error("❌ Datos incorrectos para roleplay");
      return false;
    }

    const cmd = String(comando || "")
      .toLowerCase()
      .replace(".", "")
      .trim();

    const accion = acciones[cmd];

    // No es un comando de roleplay
    if (!accion) {
      return false;
    }

    // =========================================
    // 🔎 BUSCAR MENCIÓN REAL DE WHATSAPP
    // =========================================

    const context =
      msg?.message?.extendedTextMessage?.contextInfo;

    const mencionados =
      context?.mentionedJid || [];

    if (!mencionados.length) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ Debes mencionar a una persona.

Ejemplo:
.${cmd} @usuario`
        },
        { quoted: msg }
      );

      return true;
    }

    const objetivo = mencionados[0];

    // =========================================
    // 🔑 API KEY DE GIPHY
    // =========================================

    const apiKey = process.env.GIPHY_API_KEY;

    if (!apiKey) {

      console.error("❌ Falta GIPHY_API_KEY en Render");

      await sock.sendMessage(
        chat,
        {
          text: "❌ La API de GIF no está configurada."
        },
        { quoted: msg }
      );

      return true;
    }

    // =========================================
    // 🎬 BUSCAR GIF
    // =========================================

    await sock.sendMessage(
      chat,
      {
        text: "🎬 Buscando GIF..."
      },
      { quoted: msg }
    );

    const respuesta = await axios.get(
      GIPHY_API,
      {
        params: {
          api_key: apiKey,
          q: accion.busqueda,
          limit: 10,
          rating: "g",
          lang: "en"
        },
        timeout: 20000
      }
    );

    const resultados =
      respuesta.data?.data || [];

    if (!resultados.length) {

      await sock.sendMessage(
        chat,
        {
          text: "❌ No encontré un GIF para esta acción."
        },
        { quoted: msg }
      );

      return true;
    }

    // =========================================
    // 🎲 GIF ALEATORIO
    // =========================================

    const gif =
      resultados[
        Math.floor(Math.random() * resultados.length)
      ];

    const gifUrl =
      gif?.images?.original?.url ||
      gif?.images?.downsized?.url;

    if (!gifUrl) {
      throw new Error("GIPHY no devolvió una URL válida.");
    }

    // =========================================
    // 👤 NÚMERO DEL USUARIO MENCIONADO
    // =========================================

    const numero =
      objetivo.split("@")[0];

    // =========================================
    // 🎬 ENVIAR GIF + TEXTO
    // =========================================

    await sock.sendMessage(
      chat,
      {
        video: {
          url: gifUrl
        },

        gifPlayback: true,

        caption:
`${accion.emoji} ${accion.texto} @${numero}`,

        mentions: [objetivo]
      },
      { quoted: msg }
    );

    console.log(
      `🎭 ROLEPLAY: ${cmd} → ${objetivo}`
    );

    return true;

  } catch (error) {

    console.error("❌ ERROR ROLEPLAY:");

    console.error(
      error.response?.data ||
      error.message
    );

    await sock.sendMessage(
      chat,
      {
        text:
`❌ No pude cargar el GIF.

Revisa los logs de Render.`
      },
      { quoted: msg }
    );

    return true;
  }
}

module.exports = roleplay;
