const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan daftar perintah yang tersedia'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Daftar Perintah Bot')
      .setColor(0x5865F2)
      .setDescription('Berikut perintah yang tersedia untuk mengelola voice channel kamu:')
      .addFields(
        {
          name: '🔊 Join to Create',
          value: `Masuk ke channel **"${process.env.TRIGGER_CHANNEL_NAME || '➕ Create Voice Channel'}"** untuk otomatis dibuatkan voice channel pribadi!`,
        },
        {
          name: '✏️ `/rename <nama>`',
          value: 'Ganti nama voice channel kamu.\n_Contoh: `/rename Gaming Room`_',
        },
        {
          name: '👥 `/limit <jumlah>`',
          value: 'Set batas maksimum member di channel kamu. Isi `0` untuk unlimited.\n_Contoh: `/limit 5`_',
        },
        {
          name: '❓ `/help`',
          value: 'Tampilkan pesan ini.',
        }
      )
      .setFooter({ text: 'Channel akan otomatis dihapus saat semua member keluar.' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
