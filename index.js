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
// SAFE VOICE CONNECT (ANTI DROP)
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

        console.log('🎵 Voice Connected');

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('⚠️ Voice Reconnecting...');
            setTimeout(connectVoice, 7000);
        });

    } catch (err) {
        console.log('VOICE ERROR:', err.message);
        setTimeout(connectVoice, 7000);
    }
}

// ==========================
// READY EVENT
// ==========================
client.once('ready', async () => {

    console.log(`✅ ${client.user.tag} Online`);

    connectVoice();

    const startTime = Date.now();

    // ==========================
    // FORMAT TIME
    // ==========================
    const format = (ms) => {
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return { d, h, m };
    };

    // ==========================
    // SAFE UPDATE SYSTEM (ANTI OVERLOAD)
    // ==========================
    const updateAll = async () => {

        try {

            const guild = client.guilds.cache.get(config.GUILD_ID);
            if (!guild) return;

            const ping = client.ws.ping || 0;

            const botUp = format(Date.now() - startTime);
            const serverUp = format(process.uptime() * 1000);

            // ==========================
            // VOICE CHANNEL (UPTIME + PING MIN)
            // ==========================
            const voice = await client.channels.fetch(config.VOICE_ID).catch(() => null);

            if (voice) {

                const pingMin = Math.max(0, Math.floor(ping / 60000));

                const newName =
                    `🟢B:${botUp.d}d${botUp.h}h 🟡S:${serverUp.d}d${serverUp.h}h 🔵P:${pingMin} min`;

                if (voice.name !== newName) {
                    await voice.setName(newName).catch(() => {});
                }
            }

            // ==========================
            // BOT STATUS
            // ==========================
            const botStatus = await client.channels.fetch(config.BOT_STATUS_CHANNEL).catch(() => null);
            if (botStatus) {

                const name = `🟢 BOT ONLINE | ${ping}ms`;

                if (botStatus.name !== name) {
                    await botStatus.setName(name).catch(() => {});
                }
            }

            // ==========================
            // MEMBER COUNT
            // ==========================
            const member = await client.channels.fetch(config.MEMBER_CHANNEL).catch(() => null);
            if (member) {

                const name = `👥 MEMBERS: ${guild.memberCount}`;

                if (member.name !== name) {
                    await member.setName(name).catch(() => {});
                }
            }

            // ==========================
            // ORDER CHANNEL
            // ==========================
            const order = await client.channels.fetch(config.ORDER_CHANNEL).catch(() => null);
            if (order) {

                const name = `💰 ORDERS: 128`;

                if (order.name !== name) {
                    await order.setName(name).catch(() => {});
                }
            }

        } catch (err) {
            console.log('UPDATE ERROR:', err.message);
        }
    };

    // ==========================
    // RUN STABLE INTERVAL (ANTI LAG)
    // ==========================
    updateAll();
    setInterval(updateAll, 60000); // ❗ diperpanjang 60 detik supaya stabil

    // ==========================
    // STATUS ROTATOR
    // ==========================
    const statuses = [
        '🛒 SKYSTORE COMMUNITY',
        '🎫 OPEN TICKET',
        '⭐ TRUSTED STORE',
        '💎 ROBUX VIA USN',
        '🚀 SERVER BOOST'
    ];

    let i = 0;

    setInterval(() => {
        client.user.setPresence({
            activities: [{
                name: statuses[i],
                type: ActivityType.Watching
            }],
            status: 'online'
        });

        i++;
        if (i >= statuses.length) i = 0;

    }, 20000); // ❗ lebih stabil (20 detik)

});

// ==========================
// LOGIN
// ==========================
client.login(process.env.TOKEN);
