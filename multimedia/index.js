  if (!resultados.length) {
    await sock.sendMessage(jid, {
      text: "🔎 No encontré ese título en el catálogo."
    }, quoted ? { quoted } : {});

    return true;
  }

  const item = resultados[0];

  if (!item.archivo) {
    await sock.sendMessage(jid, {
      text: "⚠️ Este título todavía no tiene un archivo asociado."
    }, quoted ? { quoted } : {});

    return true;
  }

  const carpetaVideos = path.join(BASE, "videos");
  const archivo = path.resolve(carpetaVideos, item.archivo);

  // Impedir rutas fuera de la carpeta de vídeos.
  if (
    path.dirname(archivo) !== carpetaVideos ||
    !fs.existsSync(archivo) ||
    !fs.statSync(archivo).isFile()
  ) {
    await sock.sendMessage(jid, {
      text: "⚠️ No encuentro el archivo en el servidor."
    }, quoted ? { quoted } : {});

    return true;
  }

  try {
    await sock.sendMessage(jid, {
      video: { url: archivo },
      mimetype: "video/mp4",
      caption: `🎬 ${item.titulo}`
    }, quoted ? { quoted } : {});
  } catch (error) {
    console.error("[MEDIA] Error enviando vídeo:", error);

    await sock.sendMessage(jid, {
      text: "❌ No pude enviar el vídeo. Comprueba su formato y tamaño."
    }, quoted ? { quoted } : {});
  }

  return true;
