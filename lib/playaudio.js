// lib/playaudio.js
// TITANBOT - Conversor de audio MP3

const fetch = globalThis.fetch;

const playaudio = {
  static: Object.freeze({
    baseUrl: "https://cnv.cx",
    headers: {
      "accept-encoding": "gzip, deflate, br",
      "origin": "https://frame.y2meta-uk.com",
      "user-agent": "Mozilla/5.0"
    }
  }),

  // Preparar los datos de conversión
  resolvePayload(link, format = "128k") {
    if (!["128k", "320k"].includes(format)) {
      throw new Error("Formato inválido. Usa 128k o 320k.");
    }

    if (!/^https?:\/\//i.test(link)) {
      throw new Error("El enlace proporcionado no es válido.");
    }

    return {
      link,
      format: "mp3",
      audioBitrate: format.replace("k", ""),
      filenameStyle: "pretty"
    };
  },

  // Limpiar el nombre del archivo
  sanitizeFileName(name) {
    const filename = String(name || "audio.mp3");
    const match = filename.match(/\.[^.]+$/);
    const extension = match ? match[0] : ".mp3";

    const base = filename
      .slice(0, filename.length - (match ? extension.length : 0))
      .replace(/[^A-Za-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase();

    return `${base || "audio"}${extension}`;
  },

  // Descargar el audio convertido
  async getBuffer(url) {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("La URL de descarga no es válida.");
    }

    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error(
        `Error descargando el audio: HTTP ${response.status}`
      );
    }

    return Buffer.from(await response.arrayBuffer());
  },

  // Obtener la clave de la API
  async getKey() {
    if (typeof fetch !== "function") {
      throw new Error(
        "fetch no está disponible. Comprueba la versión de Node.js."
      );
    }

    const response = await fetch(
      `${this.static.baseUrl}/v2/sanity/key`,
      {
        headers: this.static.headers
      }
    );

    const body = await response.text();

    console.log("[PLAY API] getKey HTTP:", response.status);
    console.log("[PLAY API] getKey respuesta:", body.slice(0, 500));

    if (!response.ok) {
      throw new Error(
        `getKey HTTP ${response.status}: ${body.slice(0, 200)}`
      );
    }

    let data;

    try {
      data = JSON.parse(body);
    } catch {
      throw new Error("La API no devolvió JSON válido al solicitar la clave.");
    }

    if (!data.key) {
      throw new Error("La respuesta de la API no contiene una clave.");
    }

    return data;
  },

  // Convertir el enlace a MP3
  async convert(url, format = "128k") {
    const { key } = await this.getKey();
    const payload = this.resolvePayload(url, format);

    const response = await fetch(
      `${this.static.baseUrl}/v2/converter`,
      {
        method: "POST",
        headers: {
          ...this.static.headers,
          "key": key,
          "content-type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(payload)
      }
    );

    const body = await response.text();

    console.log("[PLAY API] convert HTTP:", response.status);
    console.log("[PLAY API] convert respuesta:", body.slice(0, 500));

    if (!response.ok) {
      throw new Error(
        `convert HTTP ${response.status}: ${body.slice(0, 200)}`
      );
    }

    try {
      return JSON.parse(body);
    } catch {
      throw new Error("La API no devolvió JSON válido al convertir.");
    }
  },

  // Obtener el MP3 completo
  async download(url, format = "128k") {
    const result = await this.convert(url, format);

    if (!result.url || !/^https?:\/\//i.test(result.url)) {
      throw new Error(
        "La API no devolvió un enlace de descarga válido."
      );
    }

    const buffer = await this.getBuffer(result.url);

    if (!buffer.length) {
      throw new Error("El archivo de audio está vacío.");
    }

    return {
      buffer,
      fileName: this.sanitizeFileName(result.filename)
    };
  }
};

module.exports = { playaudio };
