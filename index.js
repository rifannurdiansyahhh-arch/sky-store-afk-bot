require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActivityType
} = require('discord.js');

const {
    joinVoiceChannel,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let connection;

// ==========================
// VOICE CONNECT
// ==========================
function connectVoice() {
    try {

        const guild = client.guilds.cache.get(config.GUILD_ID);
        if (!guild) return;

        connection = joinVoiceChannel({
            channelId: config.VOICE_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            setTimeout(connectVoice, 5000);
        });

    } catch (err) {
        setTimeout(connectVoice, 5000);
    }
}

// ==========================
// READY
// ==========================
client.once('ready', async () => {

    console.log(`✅ ${client.user.tag} Online`);

    connectVoice();

    const startTime = Date.now();

    const format = (ms) => {
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return { d, h, m };
    };

    const updateAll = async () => {

        try {

            const guild = client.guilds.cache.get(config.GUILD_ID);
            if (!guild) return;

            const ping = client.ws?.ping || 0;

            const botUp = format(Date.now() - startTime);
            const serverUp = format(process.uptime() * 1000);

            // ==========================
            // VOICE AFK (FIX FINAL EXACT FORMAT)
            // ==========================
            const voice = await client.channels.fetch(config.VOICE_ID).catch(() => null);

            if (voice) {

                const name =
                    `🔵 AFK B:${botUp.d}d ${botUp.h}h ${botUp.m}m | S:${serverUp.d}d ${serverUp.h}h ${serverUp.m}m | P:${ping}ms`;

                if (voice.name !== name) {
                    await voice.setName(name).catch(() => {});
                }
            }

        } catch (err) {
            console.log(err.message);
        }
    };

    updateAll();
    setInterval(updateAll, 60000);

});

// ==========================
// MESSAGE SYSTEM (FIXED)
// ==========================
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // ==========================
    // OPEN TICKET (FIX 100% WORK)
    // ==========================
    if (config.PRODUCT_CHANNELS?.includes(message.channel.id)) {

        const msg = await message.reply(
            `🎫 Untuk pembelian silakan buka ticket di <#${config.OPEN_TICKET}>`
        ).catch(() => null);

        if (msg) {
            setTimeout(() => {
                msg.delete().catch(() => {});
            }, 300000);
        }

        return;
    }

});

// ==========================
// LOGIN
// ==========================
client.login(process.env.TOKEN);
