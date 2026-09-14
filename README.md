# TITANBOT v2.9 — actualización

Incluye la base de TITANBOT con vinculación por número y estas mejoras:

- Vinculación por número únicamente; QR de terminal desactivado.
- Render: variable `NUMBER` para el número de WhatsApp, solo dígitos con código de país.
- Navegador Baileys configurado como Chrome/Ubuntu.
- `.anime` / `.waifu` generan un personaje pendiente.
- `.w` reclama el personaje y lo guarda en `inventory`.
- `.inventario` conserva el sistema existente.
- `.musica <enlace directo>` envía archivos multimedia cuando el enlace apunta directamente a un archivo de audio o vídeo.
- No incluye conversión/descarga desde YouTube u otras plataformas; usa enlaces directos a medios que el usuario tenga derecho a compartir.

## Render

Variables de entorno:

- `NUMBER` = número de WhatsApp con código de país, por ejemplo `573001234567`.
- `ANIME_IMAGE_URL` = opcional, URL pública de la imagen usada por las tarjetas anime.

Comando de inicio:

`npm start`

Antes de desplegar, elimina una sesión `auth_info` anterior si la vinculación anterior quedó a medias.
