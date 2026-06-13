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
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (!guild) return;

    try {
        connection = joinVoiceChannel({
            channelId: config.VOICE_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });

        console.log('🎵 Voice Connected');

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            setTimeout(connectVoice, 5000);
        });

    } catch (err) {
        console.log(err);
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

    const getPingColor = (ping) => {
        if (ping > 150) return '🔴';
        if (ping > 70) return '🟡';
        return '🔵';
    };

    const updateAll = async () => {
        try {

            const guild = client.guilds.cache.get(config.GUILD_ID);
            if (!guild) return;

            const ping = client.ws.ping;

            const botUp = format(Date.now() - startTime);
            const serverUp = format(process.uptime() * 1000);

            // VOICE UPTIME
            const voice = await client.channels.fetch(config.VOICE_ID);
            if (voice) {
                await voice.setName(
                    `🟢B:${botUp.d}d 🟡S:${serverUp.h}h ${getPingColor(ping)}P:${ping}ms`
                ).catch(() => {});
            }

            // BOT STATUS
            const botStatus = await client.channels.fetch(config.BOT_STATUS_CHANNEL);
            if (botStatus) {
                await botStatus.setName(`🟢 BOT ONLINE | ${ping}ms`).catch(() => {});
            }

            // MEMBER COUNT
            const member = await client.channels.fetch(config.MEMBER_CHANNEL);
            if (member) {
                await member.setName(`👥 MEMBERS: ${guild.memberCount}`).catch(() => {});
            }

            // ORDER COUNT (manual / bisa diganti database nanti)
            const order = await client.channels.fetch(config.ORDER_CHANNEL);
            if (order) {
                await order.setName(`💰 ORDERS: 128`).catch(() => {});
            }

        } catch (err) {
            console.log('UPDATE ERROR:', err.message);
        }
    };

    updateAll();
    setInterval(updateAll, 30000);

    // ==========================
    // STATUS ROTATOR
    // ==========================
    const statuses = [
        '🛒 SKYSTORE COMMUNITY',
        '🎫 OPEN TICKET',
        '⭐ Trusted STORE',
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

    }, 15000);

    // ==========================
    // RATING AUTO MESSAGE
    // ==========================
    const ratingChannel = client.channels.cache.get(config.RATING_CHANNEL);

    if (ratingChannel) {
        setInterval(() => {
            ratingChannel.send(
                '⭐ Sudah transaksi? Jangan lupa rating & testimoni ya! Terima kasih telah menggunakan SKYSTORE COMMUNITY.'
            ).catch(() => {});
        }, 3600000);
    }
});

// ==========================
// MESSAGE SYSTEM
// ==========================
const spamMap = new Map();

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // anti invite
    if (
        message.content.includes('discord.gg/') ||
        message.content.includes('discord.com/invite/')
    ) {
        await message.delete().catch(() => {});
        return message.channel.send(`${message.author} ❌ Link tidak diperbolehkan.`);
    }

    // anti spam
    const now = Date.now();

    if (!spamMap.has(message.author.id)) {
        spamMap.set(message.author.id, []);
    }

    const userMessages = spamMap.get(message.author.id);
    userMessages.push(now);

    const filtered = userMessages.filter(t => now - t < 5000);
    spamMap.set(message.author.id, filtered);

    if (filtered.length >= 5) {
        await message.delete().catch(() => {});
        return message.channel.send(`${message.author} ⚠️ Jangan spam.`);
    }

    // auto ticket
    if (config.PRODUCT_CHANNELS.includes(message.channel.id)) {
        const msg = await message.reply(
            `🎫 Buka ticket di <#${config.OPEN_TICKET}>`
        );

        setTimeout(() => {
            msg.delete().catch(() => {});
        }, 300000);

        return;
    }

    // staff log
    const logChannel = client.channels.cache.get(config.STAFF_LOG_CHANNEL);

    if (logChannel) {
        logChannel.send(
            `📌 ${message.author.tag} di #${message.channel.name}`
        ).catch(() => {});
    }
});

// ==========================
// LOGIN (WAJIB PALING BAWAH)
// ==========================
client.login(process.env.TOKEN);
