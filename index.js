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
// VOICE CONNECT SAFE
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
            setTimeout(connectVoice, 5000);
        });

    } catch (err) {
        console.log('VOICE ERROR:', err.message);
        setTimeout(connectVoice, 5000);
    }
}

// ==========================
// READY EVENT
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

            // 🔥 FIX PING ALWAYS VALID
            const ping = client.ws?.ping ?? 0;

            const botUp = format(Date.now() - startTime);
            const serverUp = format(process.uptime() * 1000);

            // ==========================
            // VOICE UPTIME (FIXED)
            // ==========================
            const voice = await client.channels.fetch(config.VOICE_ID).catch(() => null);

            if (voice) {

                const pingMin = Math.max(0, Math.floor(ping / 60000));

                const name =
                    `🟢B:${botUp.d}d 🟡S:${serverUp.h}h 🔵P:${pingMin} min`;

                if (voice.name !== name) {
                    await voice.setName(name).catch(() => {});
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
            // MEMBER
            // ==========================
            const member = await client.channels.fetch(config.MEMBER_CHANNEL).catch(() => null);

            if (member) {
                const name = `👥 MEMBERS: ${guild.memberCount}`;
                if (member.name !== name) {
                    await member.setName(name).catch(() => {});
                }
            }

            // ==========================
            // ORDER
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

    updateAll();
    setInterval(updateAll, 60000);

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

        i = (i + 1) % statuses.length;

    }, 20000);

});

// ==========================
// MESSAGE SYSTEM (FULL FIXED)
// ==========================
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // ==========================
    // STAFF LOG (FIXED)
    // ==========================
    const logChannel = client.channels.cache.get(config.STAFF_LOG_CHANNEL);

    if (logChannel) {
        logChannel.send(
            `📌 ${message.author.tag} mengirim di #${message.channel.name}`
        ).catch(() => {});
    }

    // ==========================
    // ANTI INVITE
    // ==========================
    if (
        message.content.includes('discord.gg/') ||
        message.content.includes('discord.com/invite/')
    ) {
        await message.delete().catch(() => {});
        return message.channel.send(`❌ Link tidak diperbolehkan.`);
    }

    // ==========================
    // TICKET FIX TEXT (SESUAI REQUEST)
    // ==========================
    if (config.PRODUCT_CHANNELS.includes(message.channel.id)) {

        const msg = await message.reply(
            `🎫 Untuk pembelian silakan buka ticket di <#${config.OPEN_TICKET}>`
        ).catch(() => null);

        if (msg) {
            setTimeout(() => {
                msg.delete().catch(() => {});
            }, 180000); // 3 MENIT
        }

        return;
    }

});

// ==========================
// LOGIN
// ==========================
client.login(process.env.TOKEN);
