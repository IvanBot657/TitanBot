
const axios = require("axios");
const crypto = require("crypto");

const ogmp3 = {
  api: {
    base: "https://api3.apiapi.lat",
    endpoints: [
      "https://api5.apiapi.lat",
      "https://api.apiapi.lat",
      "https://api3.apiapi.lat"
    ]
  },

  headers: {
    "content-type": "application/json",
    "origin": "https://ogmp3.lat",
    "referer": "https://ogmp3.lat/",
    "user-agent": "Mozilla/5.0"
  },

  formats: {
    audio: ["64", "96", "128", "192", "256", "320"],
    video: ["240", "360", "480", "720", "1080"]
  },

  default_fmt: {
    audio: "320",
    video: "720"
  },

  utils: {
    hash() {
      return crypto.randomBytes(16).toString("hex");
    },

    encoded(str) {
      return Array.from(str, char =>
        String.fromCharCode(char.charCodeAt(0) ^ 1)
      ).join("");
    },

    enc_url(url) {
      return Array.from(url)
        .map(char => char.charCodeAt(0))
        .reverse()
        .join(",");
    }
  },

  isUrl(value) {
    try {
      const url = new URL(value);
      return (
        ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]
          .includes(url.hostname) &&
        !url.searchParams.has("list")
      );
    } catch {
      return false;
    }
  },

  youtube(url) {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  },

  async request(endpoint, data = {}) {
    try {
      const host =
        this.api.endpoints[
          Math.floor(Math.random() * this.api.endpoints.length)
        ];

      const response = await axios.post(
        endpoint.startsWith("http") ? endpoint : host + endpoint,
        data,
        {
          headers: this.headers,
          timeout: 20000
        }
      );

      return { status: true, data: response.data };
    } catch (error) {
      return {
        status: false,
        code: error.response?.status || 500,
        error: error.message
      };
    }
  },

  async checkStatus(id) {
    const a = this.utils.hash();
    const b = this.utils.hash();

    return this.request(
      `/${a}/status/${this.utils.encoded(id)}/${b}/`,
      { data: id }
    );
  },

  async download(link, format = "192", type = "audio") {
    if (!this.isUrl(link)) {
      return {
        status: false,
        error: "Debes proporcionar un enlace válido de YouTube."
      };
    }

    if (!["audio", "video"].includes(type)) {
      return { status: false, error: "Formato de descarga inválido." };
    }

    const validFormats = this.formats[type];

    if (!validFormats.includes(String(format))) {
      format = this.default_fmt[type];
    }

    const id = this.youtube(link);

    if (!id) {
      return { status: false, error: "No se pudo identificar el video." };
    }

    const a = this.utils.hash();
    const b = this.utils.hash();

    const payload = {
      data: this.utils.encoded(link),
      format: type === "audio" ? "0" : "1",
      referer: "https://ogmp3.cc",
      mp3Quality: type === "audio" ? String(format) : null,
      mp4Quality: type === "video" ? String(format) : null,
      userTimeZone: new Date().getTimezoneOffset().toString()
    };

    const response = await this.request(
      `/${a}/init/${this.utils.enc_url(link)}/${b}/`,
      payload
    );

    if (!response.status) return response;

    const data = response.data;

    if (!data || data.e || data.i === "invalid" ||
        data.i === "blacklisted" || data.le) {
      return {
        status: false,
        error: "El servicio no pudo procesar el video."
      };
    }

    if (data.s !== "C" || !data.i) {
      return {
        status: false,
        error: "El servicio no confirmó que el audio esté listo."
      };
    }

    return {
      status: true,
      result: {
        title: data.t || "audio",
        type,
        format: String(format),
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        download:
          `${this.api.base}/${this.utils.hash()}/download/` +
          `${this.utils.encoded(data.i)}/${this.utils.hash()}/`,
        id,
        quality: String(format)
      }
    };
  }
};

module.exports = { ogmp3 };
