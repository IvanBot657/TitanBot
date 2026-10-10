// lib/playaudio.js
const fetch = globalThis.fetch;

const playaudio = {
  static: Object.freeze({
    baseUrl: "https://cnv.cx",
    headers: {
      "accept-encoding": "gzip, deflate, br",
      origin: "https://frame.y2meta-uk.com",
      "user-agent": "Mozilla/5.0"
    }
  }),

  resolvePayload(link, f = "128k") {
    if (!["128k", "320k"].includes(f)) {
      throw new Error("Formato inválido");
    }

    return {
      link,
      format: "mp3",
      audioBitrate: f.replace("k", ""),
      filenameStyle: "pretty"
    };
  },

  sanitizeFileName(name) {
    const filename = String(name || "audio.mp3");
    const match = filename.match(/\.[^.]+$/);
    const ext = match ? match[0] : ".mp3";

    const base = filename
      .slice(0, filename.length - (match ? ext.length : 0))
      .replace(/[^A-Za-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase();

    return `${base || "audio"}${ext}`;
  },

  async getBuffer(url) {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("URL de descarga inválida");
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No se pudo descargar el archivo");
    }

    return Buffer.from(await response.arrayBuffer());
  },

  async getKey() {
    const response = await fetch(
      `${this.static.baseUrl}/v2/sanity/key`,
      { headers: this.static.headers }
    );

    if (!response.ok) {
      throw new Error(`Error de API: HTTP ${response.status}`);
    }

    return response.json();
  },

  async convert(url, format = "128k") {
    const { key } = await this.getKey();

    if (!key) {
      throw new Error("La API no devolvió la clave");
    }

    const response = await fetch(
      `${this.static.baseUrl}/v2/converter`,
      {
        method: "POST",
        headers: {
          ...this.static.headers,
          key,
          "content-type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(
          this.resolvePayload(url, format)
        )
      }
    );

    if (!response.ok) {
      throw new Error(`Error de conversión: HTTP ${response.status}`);
    }

    return response.json();
  },

  async download(url, format = "128k") {
    const result = await this.convert(url, format);

    if (!result.url || !/^https?:\/\//i.test(result.url)) {
      throw new Error("La API no devolvió un enlace válido");
    }

    const buffer = await this.getBuffer(result.url);

    return {
      buffer,
      fileName: this.sanitizeFileName(result.filename)
    };
  }
};

module.exports = { playaudio };
