require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const fs     = require('fs');
const path   = require('path');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const tempChannels = new Map();
client.tempChannels = tempChannels;

// Load Slash Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    logger.info(`Command loaded: /${command.data.name}`);
  }
}

// Event: Bot Ready
client.once('clientReady', () => {
  logger.info(`Bot aktif sebagai: ${client.user.tag}`);
  logger.info(`Terhubung ke ${client.guilds.cache.size} server(s)`);
  logger.info(`Trigger channel: "${process.env.TRIGGER_CHANNEL_NAME}"`);
  client.user.setActivity('🔊 Voice Channels | /help', { type: 3 });
});

// Event: Voice State Update
client.on('voiceStateUpdate', async (oldState, newState) => {
  const triggerName = process.env.TRIGGER_CHANNEL_NAME || '➕ Create Voice Channel';

  // A. Member JOIN trigger channel
  if (newState.channel && newState.channel.name === triggerName && newState.member) {
    const member  = newState.member;
    const guild   = newState.guild;
    const trigger = newState.channel;

    logger.info(`[JOIN-TRIGGER] ${member.user.tag} masuk ke trigger channel "${triggerName}"`);

    const categoryId = process.env.CATEGORY_ID?.trim() ? process.env.CATEGORY_ID : trigger.parentId;

    try {
      const newChannel = await guild.channels.create({
        name:   `🔊 ${member.displayName}'s Channel`,
        type:   ChannelType.GuildVoice,
        parent: categoryId,
        permissionOverwrites: [
          {
            id:    member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
            ],
          },
          {
            id:    guild.roles.everyone.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
        ],
      });

      await member.voice.setChannel(newChannel);
      tempChannels.set(newChannel.id, member.id);
      logger.info(`[CREATE] Channel dibuat: "${newChannel.name}" (ID: ${newChannel.id}) untuk ${member.user.tag}`);
    } catch (err) {
      logger.error(`[CREATE-FAIL] Gagal membuat channel untuk ${member.user.tag}: ${err.message}`);
    }
  }

  // B. Member JOIN temp channel
  if (
    newState.channel &&
    tempChannels.has(newState.channel.id) &&
    newState.member &&
    newState.channel.id !== oldState.channel?.id
  ) {
    const ch = newState.channel;
    logger.info(`[JOIN] ${newState.member.user.tag} bergabung ke "${ch.name}" (${ch.members.size} member)`);
  }

  // C. Member LEAVE temp channel → auto-delete jika kosong
  if (oldState.channel && tempChannels.has(oldState.channel.id)) {
    const leftChannel = oldState.channel;
    const member      = oldState.member;

    logger.info(`[LEAVE] ${member?.user.tag ?? 'Unknown'} keluar dari "${leftChannel.name}" (sisa: ${leftChannel.members.size} member)`);

    if (leftChannel.members.size === 0) {
      try {
        const chName = leftChannel.name;
        await leftChannel.delete();
        tempChannels.delete(leftChannel.id);
        logger.info(`[DELETE] Channel "${chName}" dihapus (kosong)`);
      } catch (err) {
        tempChannels.delete(leftChannel.id);
        logger.warn(`[DELETE-SKIP] Channel sudah tidak ada: ${err.message}`);
      }
    }
  }
});

// Event: Mention Handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user) && !message.mentions.everyone;
  if (!isMentioned) return;

  logger.info(`[MENTION] ${message.author.tag} men-tag bot di #${message.channel.name}`);

  const triggerName = process.env.TRIGGER_CHANNEL_NAME || '➕ Create Voice Channel';

  const embed = new EmbedBuilder()
    .setTitle('👋 Halo! Saya Channel Bot Milik Warkop Jam 2 Pagi')
    .setColor(0x5865F2)
    .setDescription('Saya adalah bot yang mengelola **voice channel sementara** secara otomatis!')
    .addFields(
      {
        name: '🔊 Join to Create',
        value: `Masuk ke channel **"${triggerName}"** dan saya akan otomatis membuatkan voice channel pribadi untukmu!`,
      },
      {
        name: '🗑️ Auto Delete',
        value: 'Channel akan otomatis dihapus saat semua member keluar.',
      },
      {
        name: '✏️ /rename',
        value: 'Ganti nama voice channel milikmu.',
      },
      {
        name: '👥 /limit',
        value: 'Atur batas maksimum member di channel milikmu.',
      },
      {
        name: '❓ /help',
        value: 'Tampilkan daftar lengkap perintah.',
      },
    )
    .setFooter({ text: 'Ketik /help untuk info lebih lengkap!' })
    .setTimestamp();

  try {
    await message.reply({ embeds: [embed] });
  } catch (err) {
    logger.error(`[MENTION-REPLY-FAIL] ${err.message}`);
  }
});

// Event: Slash Command Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  logger.info(`[COMMAND] ${interaction.user.tag} menjalankan /${interaction.commandName}`);

  try {
    await command.execute(interaction, client);
  } catch (error) {
    logger.error(`[COMMAND-FAIL] /${interaction.commandName} oleh ${interaction.user.tag}: ${error.message}`);
    const msg = { content: '⚠️ Terjadi kesalahan saat menjalankan perintah.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(process.env.BOT_TOKEN);
