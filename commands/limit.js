const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limit')
    .setDescription('Set batas maksimum member di channel kamu (0 = unlimited)')
    .addIntegerOption(option =>
      option
        .setName('jumlah')
        .setDescription('Jumlah maksimum member (0-99). Isi 0 untuk unlimited.')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(99)
    ),

  async execute(interaction, client) {
    const member       = interaction.member;
    const voiceState   = member.voice;
    const tempChannels = client.tempChannels;

    // Cek apakah member sedang di voice channel
    if (!voiceState.channel) {
      return interaction.reply({
        content: '❌ Kamu harus berada di voice channel terlebih dahulu!',
        ephemeral: true,
      });
    }

    const channelId = voiceState.channel.id;

    // Cek apakah channel adalah channel temp milik bot
    if (!tempChannels.has(channelId)) {
      return interaction.reply({
        content: '❌ Perintah ini hanya bisa digunakan di channel yang dibuat oleh bot.',
        ephemeral: true,
      });
    }

    // Cek apakah member adalah owner channel
    const ownerId = tempChannels.get(channelId);
    if (ownerId !== member.id) {
      return interaction.reply({
        content: '❌ Hanya owner channel yang bisa mengatur batas member!',
        ephemeral: true,
      });
    }

    const limit = interaction.options.getInteger('jumlah');

    try {
      await voiceState.channel.setUserLimit(limit);

      const message = limit === 0
        ? '✅ Batas member dihapus. Channel sekarang **unlimited**!'
        : `✅ Batas member diset ke **${limit} orang**!`;

      return interaction.reply({ content: message, ephemeral: true });
    } catch (err) {
      console.error('❌ Gagal set limit:', err.message);
      return interaction.reply({
        content: '❌ Gagal mengatur batas member. Pastikan bot punya permission **Manage Channels**.',
        ephemeral: true,
      });
    }
  },
};
