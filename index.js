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

    // ==========================
    // FORMAT TIME (d h m)
    // ==========================
    const format = (ms) => {
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return { d, h, m };
    };

    // ==========================
    // MAIN UPDATE SYSTEM
    // ==========================
    const updateAll = async () => {

        try {

            const guild = client.guilds.cache.get(config.GUILD_ID);
            if (!guild) return;

            const ping = client.ws?.ping || 0;

            const botUp = format(Date.now() - startTime);
            const serverUp = format(process.uptime() * 1000);

            // ==========================
            // VOICE AFK (FINAL FIX ICON BIRU + D H M)
            // ==========================
            const voice = await client.channels.fetch(config.VOICE_ID).catch(() => null);

            if (voice) {

                const name =
                    `🔵 AFK B:${botUp.d}d ${botUp.h}h ${botUp.m}m | S:${serverUp.d}d ${serverUp.h}h ${serverUp.m}m | P:${ping}ms`;

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
            const guildData = await client.guilds.fetch(config.GUILD_ID).catch(() => null);

            const member = await client.channels.fetch(config.MEMBER_CHANNEL).catch(() => null);

            if (member && guildData) {
                const name = `👥 MEMBERS: ${guildData.memberCount}`;
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
// MESSAGE SYSTEM (STABLE)
// ==========================
const spamMap = new Map();
const cooldown = new Map();

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const now = Date.now();

    // ==========================
    // STAFF LOG (ANTI DOUBLE)
    // ==========================
    const last = cooldown.get(message.author.id) || 0;

    if (now - last > 5000) {
        const log = client.channels.cache.get(config.STAFF_LOG_CHANNEL);

        if (log) {
            log.send(`📌 ${message.author.tag} di #${message.channel.name}`)
                .catch(() => {});
        }
        cooldown.set(message.author.id, now);
    }

    // ==========================
    // ANTI INVITE
    // ==========================
    if (
        message.content.includes('discord.gg/') ||
        message.content.includes('discord.com/invite/')
    ) {
        await message.delete().catch(() => {});
        return message.channel.send('❌ Link tidak diperbolehkan.');
    }

    // ==========================
    // ANTI SPAM
    // ==========================
    if (!spamMap.has(message.author.id)) spamMap.set(message.author.id, []);

    const list = spamMap.get(message.author.id);
    list.push(now);

    const filtered = list.filter(t => now - t < 5000);

    if (filtered.length >= 5) {
        await message.delete().catch(() => {});
        return message.channel.send('⚠️ Jangan spam.');
    }

    spamMap.set(message.author.id, filtered);

    // ==========================
    // AUTO TICKET + DELETE 5 MENIT
    // ==========================
    if (config.PRODUCT_CHANNELS.includes(message.channel.id)) {

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
