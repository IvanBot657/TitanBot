const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// Base de datos de islas
const databasePath = path.join(__dirname, '..', 'database', 'islas.json');

function cargarIslas() {
  try {
    if (!fs.existsSync(databasePath)) {
      return [];
    }

    const contenido = fs.readFileSync(databasePath, 'utf8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error('Error al cargar islas.json:', error);
    return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('isla')
    .setDescription('Muestra información sobre las islas disponibles.'),

  async execute(interaction) {
    const islas = cargarIslas();

    if (!islas.length) {
      return interaction.reply({
        content: '🏝️ No hay islas disponibles todavía.',
        ephemeral: true
      });
    }

    const isla = islas[0];

    const embed = new EmbedBuilder()
      .setTitle(`🏝️ ${isla.nombre}`)
      .setDescription(isla.descripcion || 'Una isla misteriosa.')
      .setColor(isla.color || '#2ecc71');

    if (isla.imagen) {
      embed.setImage(isla.imagen);
    }

    const boton = new ButtonBuilder()
      .setLabel('🌐 Ver isla')
      .setStyle(ButtonStyle.Link)
      .setURL(isla.url || 'http://localhost:3000');

    const row = new ActionRowBuilder()
      .addComponents(boton);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
