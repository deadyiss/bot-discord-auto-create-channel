const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Ganti nama voice channel kamu')
    .addStringOption(option =>
      option
        .setName('nama')
        .setDescription('Nama baru untuk channel kamu')
        .setRequired(true)
        .setMaxLength(100)
    ),

  async execute(interaction, client) {
    const member      = interaction.member;
    const voiceState  = member.voice;
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
        content: '❌ Hanya owner channel yang bisa mengganti nama!',
        ephemeral: true,
      });
    }

    const newName = interaction.options.getString('nama');

    try {
      await voiceState.channel.setName(`🔊 ${newName}`);
      return interaction.reply({
        content: `✅ Channel berhasil diubah menjadi **🔊 ${newName}**!`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('❌ Gagal rename channel:', err.message);
      return interaction.reply({
        content: '❌ Gagal mengubah nama channel. Pastikan bot punya permission **Manage Channels**.',
        ephemeral: true,
      });
    }
  },
};
