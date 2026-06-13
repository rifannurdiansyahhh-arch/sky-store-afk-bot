require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// GANTI DENGAN ID SERVER DAN VOICE CHANNEL KAMU
const GUILD_ID = '1514789177961615471';
const VOICE_ID = '1514934456216059965';

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} Online`);

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        console.log('❌ Server tidak ditemukan!');
        return;
    }

    try {
        joinVoiceChannel({
            channelId: VOICE_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });

        console.log('🎵 Berhasil masuk Voice Channel');
    } catch (err) {
        console.error('❌ Gagal masuk Voice Channel');
        console.error(err);
    }
});

client.on('error', console.error);

client.login(process.env.TOKEN);