const URL_CARTAS =
  "https://raw.githubusercontent.com/IvanBot657/TitanBot/main/Cartas";

const IMAGENES_CARTAS = {
  20: `${URL_CARTAS}/mago_hielo_20.png`
};

function obtenerImagen(id) {
  return IMAGENES_CARTAS[id] || null;
}
