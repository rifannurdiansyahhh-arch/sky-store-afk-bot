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

// ==========================
// ANTI DUPLICATE LOCK SYSTEM
// ==========================
if (global.__BOT_RUNNING__) {
    console.log("❌ Bot already running, preventing duplicate instance");
    process.exit(0);
}
global.__BOT_RUNNING__ = true;

// ==========================
// GLOBAL LOCKS
// ==========================
let connection;
let readyLocked = false;
let intervals = {
    update: null,
    status: null,
    rating: null
};

// ==========================
// VOICE CONNECT (SAFE)
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
            setTimeout(connectVoice, 8000);
        });

    } catch (err) {
        console.log('VOICE ERROR:', err.message);
        setTimeout(connectVoice, 8000);
    }
}

// ==========================
// READY EVENT (ANTI DUPLICATE)
// ==========================
client.once('ready', async () => {

    if (readyLocked) return;
    readyLocked = true;

    console.log(`✅ ${client.user.tag} Online`);

    connectVoice();

    const startTime = Date.now();

    const format = (ms) => {
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return { d, h, m };
    };

    // ==========================
    // SAFE UPDATE SYSTEM
    // ==========================
    const updateAll = async () => {

        try {

            const guild = client.guilds.cache.get(config.GUILD_ID);
            if (!guild) return;

            const ping = client.ws.ping || 0;

            const botUp = format(Date.now() - startTime);
            const serverUp = format(process.uptime() * 1000);

            // VOICE CHANNEL
            const voice = await client.channels.fetch(config.VOICE_ID).catch(() => null);
            if (voice) {

                const pingMin = Math.max(0, Math.floor(ping / 60000));

                const newName =
                    `🟢B:${botUp.d}d 🟡S:${serverUp.h}h 🔵P:${pingMin} min`;

                if (voice.name !== newName) {
                    await voice.setName(newName).catch(() => {});
                }
            }

            // BOT STATUS
            const botStatus = await client.channels.fetch(config.BOT_STATUS_CHANNEL).catch(() => null);
            if (botStatus) {
                const name = `🟢 BOT ONLINE | ${ping}ms`;
                if (botStatus.name !== name) {
                    await botStatus.setName(name).catch(() => {});
                }
            }

            // MEMBER
            const member = await client.channels.fetch(config.MEMBER_CHANNEL).catch(() => null);
            if (member) {
                const name = `👥 MEMBERS: ${guild.memberCount}`;
                if (member.name !== name) {
                    await member.setName(name).catch(() => {});
                }
            }

            // ORDER
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
    // PREVENT INTERVAL DUPLICATE
    // ==========================
    if (!intervals.update) {
        updateAll();
        intervals.update = setInterval(updateAll, 60000);
    }

    // ==========================
    // STATUS ROTATOR (NO DUPLICATE)
    // ==========================
    const statuses = [
        '🛒 SKYSTORE COMMUNITY',
        '🎫 OPEN TICKET',
        '⭐ TRUSTED STORE',
        '💎 ROBUX VIA USN',
        '🚀 SERVER BOOST'
    ];

    let i = 0;

    if (!intervals.status) {
        intervals.status = setInterval(() => {
            client.user.setPresence({
                activities: [{
                    name: statuses[i],
                    type: ActivityType.Watching
                }],
                status: 'online'
            });

            i = (i + 1) % statuses.length;

        }, 20000);
    }

    // ==========================
    // RATING MESSAGE (NO DUPLICATE)
    // ==========================
    if (!intervals.rating) {
        const ratingChannel = client.channels.cache.get(config.RATING_CHANNEL);

        if (ratingChannel) {
            intervals.rating = setInterval(() => {
                ratingChannel.send(
                    '⭐ Sudah transaksi? Jangan lupa rating & testimoni!'
                ).catch(() => {});
            }, 3600000);
        }
    }

});

// ==========================
// MESSAGE SYSTEM (SAFE)
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
    }

});

// ==========================
// LOGIN (ONLY ONCE)
// ==========================
client.login(process.env.TOKEN);
